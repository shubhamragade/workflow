import pytest
from app import create_app, db
from app.models import Project, Task, WorkLog
from app.services import task_service

@pytest.fixture
def app():
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

def test_task_completion_requires_logs(app):
    with app.app_context():
        project = Project(name="Test Project")
        db.session.add(project)
        db.session.commit()
        
        task = Task(project_id=project.id, title="Test Task")
        db.session.add(task)
        db.session.commit()
        
        # Try to complete without logs
        result, status = task_service.complete_task(task.id)
        assert status == 400
        assert "cannot be completed without at least one work log" in result['error']
        
        # Add a log
        task_service.create_work_log(task.id, content="Worked on it")
        
        # Try to complete again
        result, status = task_service.complete_task(task.id)
        assert status == 200
        assert "successfully" in result['message']
        assert Task.query.get(task.id).status == 'Completed'

def test_log_on_completed_task_fails(app):
    with app.app_context():
        project = Project(name="Test Project")
        db.session.add(project)
        db.session.commit()
        
        task = Task(project_id=project.id, title="Test Task")
        db.session.add(task)
        db.session.commit()
        
        # Add log and complete
        task_service.create_work_log(task.id, content="Worked on it")
        task_service.complete_task(task.id)
        
        # Try to add another log
        result, status = task_service.create_work_log(task.id, content="More work")
        assert status == 400
        assert "Cannot add logs to a completed task" in result['error']
