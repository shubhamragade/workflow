import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app import create_app, db
from app.config import Config
from app.models import Task, Project, User, WorkLog
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.orm import sessionmaker

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True

def test_optimistic_locking():
    # Use TestConfig with in-memory DB
    app = create_app(config_class=TestConfig)
    
    with app.app_context():
        db.create_all()  # Create tables with version_id column
        print("Setting up test data...")
        # Ensure we have a user
        user = User.query.first()
        if not user:
            user = User(name="Test User", email="test_concurrency@example.com")
            db.session.add(user)
            db.session.commit()
            
        # Create a project
        project = Project(name="Concurrency Project")
        db.session.add(project)
        db.session.commit()
        
        # Create a task
        task = Task(title="Original Title", project_id=project.id, user_id=user.id)
        db.session.add(task)
        db.session.commit()
        
        task_id = task.id
        print(f"Created Task {task_id} with version {task.version_id}")
        
        # Create two independent sessions connected to the same DB
        Session = sessionmaker(bind=db.engine)
        session1 = Session()
        session2 = Session()
        
        try:
            print("Starting concurrent update simulation...")
            
            # 1. User A fetches the task
            task_a = session1.query(Task).get(task_id)
            print(f"User A fetched: '{task_a.title}' (Version: {task_a.version_id})")
            
            # 2. User B fetches the task
            task_b = session2.query(Task).get(task_id)
            print(f"User B fetched: '{task_b.title}' (Version: {task_b.version_id})")
            
            # 3. User A updates the task
            task_a.title = "Updated by A"
            session1.commit()
            print(f"User A committed. New Version: {task_a.version_id}")
            
            # 4. User B tries to update the task (which is now stale)
            task_b.title = "Updated by B"
            print("User B attempting commit...")
            
            try:
                session2.commit()
                print("FAILURE: User B's commit succeeded but should have failed!")
                return False
            except StaleDataError:
                print("SUCCESS: User B's commit failed with StaleDataError as expected.")
                session2.rollback()
                return True
            except Exception as e:
                print(f"FAILURE: Unexpected error: {type(e).__name__}: {e}")
                return False
                
        finally:
            session1.close()
            session2.close()
            
            # Cleanup
            print("Cleaning up...")
            Task.query.filter_by(id=task_id).delete()
            Project.query.filter_by(id=project.id).delete()
            db.session.commit()

def test_completion_locking():
    # Use TestConfig with in-memory DB
    app = create_app(config_class=TestConfig)
    
    with app.app_context():
        db.create_all()
        print("\nSetting up test data for COMPLETION locking...")
        user = User(name="Test User", email="test_completion@example.com")
        db.session.add(user)
        project = Project(name="Completion Project")
        db.session.add(project)
        db.session.commit()
        
        task = Task(title="Task to Complete", project_id=project.id, user_id=user.id)
        # Add a log so it CAN be completed
        db.session.add(task)
        db.session.commit()
        
        log = WorkLog(task_id=task.id, user_id=user.id, content="Did work", hours_spent=1)
        db.session.add(log)
        db.session.commit()
        
        task_id = task.id
        print(f"Created Task {task_id} with version {task.version_id}")
        
        # Create two sessions
        Session = sessionmaker(bind=db.engine)
        session1 = Session()
        session2 = Session()
        
        try:
            # 1. User A fetches task
            task_a = session1.query(Task).get(task_id)
            # 2. User B fetches task
            task_b = session2.query(Task).get(task_id)
            
            # 3. User A modifies task (e.g. changes title) - increments version
            task_a.title = "Updated Title"
            session1.commit()
            print(f"User A updated task. Version is now: {task_a.version_id}")
            
            # 4. User B tries to COMPLETE task using OLD version
            # In service logic we check: task.version_id == expected_version_id
            # But here we are using SQLAlchemy session logic. 
            # If we call complete_task SERVICE, it does the check.
            # Let's verify the SERVICE logic by mocking the request context or just calling safe service?
            # We want to verify the DB constraint or Service logic?
            # The service logic raises 409. 
            # Let's simulate what the route does: checks version.
            
            # But wait, if User B calls `task_b.status = 'DONE'`, SQLAlchemy will use `version_id` in WHERE clause.
            print("User B attempting to mark DONE with stale object...")
            task_b.status = 'DONE'
            
            try:
                session2.commit()
                print("FAILURE: User B's completion succeeded but should have failed!")
                return False
            except StaleDataError:
                print("SUCCESS: User B's completion failed with StaleDataError.")
                session2.rollback()
                return True
                
        finally:
            session1.close()
            session2.close()

if __name__ == "__main__":
    s1 = test_optimistic_locking()
    s2 = test_completion_locking()
    sys.exit(0 if s1 and s2 else 1)
