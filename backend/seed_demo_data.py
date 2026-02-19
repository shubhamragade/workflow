from app import create_app, db
from app.models import User, Project, Task, WorkLog, Decision, ProjectMember, Milestone
from datetime import datetime, timedelta
import random

app = create_app()

def seed():
    with app.app_context():
        print("--- DELETING OLD DATA ---")
        db.drop_all()
        db.create_all()
        
        print("--- CREATING USERS ---")
        # 1. Admin / Product Buyer
        admin = User(name="Sarah Jenkins", email="sarah@techflow.io", role="Admin", status="Active")
        
        # 2. Key Employees
        u1 = User(name="Alex Chen", email="alex@techflow.io", role="Member", status="Active") # Senior Eng
        u2 = User(name="Priya Patel", email="priya@techflow.io", role="Member", status="Active") # Frontend
        u3 = User(name="Jordan Lee", email="jordan@techflow.io", role="Member", status="Active") # DevOps/Backend
        
        db.session.add_all([admin, u1, u2, u3])
        db.session.commit()
        
        users = [u1, u2, u3]

        print("--- CREATING PROJECTS ---")
        # Project 1: User-facing, slightly behind schedule
        p1 = Project(name="Customer Portal v2.0", description="Revamp of the client-facing dashboard with React and GraphQL.", 
                     start_date=datetime.utcnow() - timedelta(days=45),
                     target_date=datetime.utcnow() + timedelta(days=15),
                     completion_percentage=65.0, status="ACTIVE")
        
        # Project 2: Infrastructure, on track
        p2 = Project(name="Cloud Migration (AWS)", description="Migrating legacy on-prem servers to AWS ECS.", 
                     start_date=datetime.utcnow() - timedelta(days=20),
                     target_date=datetime.utcnow() + timedelta(days=60),
                     completion_percentage=30.0, status="ACTIVE")
        
        # Project 3: R&D, early stage
        p3 = Project(name="AI Recommendation Engine", description="Prototyping new recommendation models using vector search.", 
                     start_date=datetime.utcnow() - timedelta(days=5),
                     target_date=datetime.utcnow() + timedelta(days=90),
                     completion_percentage=5.0, status="ACTIVE")

        db.session.add_all([p1, p2, p3])
        db.session.commit()
        
        # Add Memberships
        for p in [p1, p2, p3]:
            db.session.add(ProjectMember(project_id=p.id, user_id=admin.id, role_in_project='Lead'))
        
        # Portal Team
        db.session.add(ProjectMember(project_id=p1.id, user_id=u1.id, role_in_project='Contributor'))
        db.session.add(ProjectMember(project_id=p1.id, user_id=u2.id, role_in_project='Contributor'))
        
        # Migration Team
        db.session.add(ProjectMember(project_id=p2.id, user_id=u1.id, role_in_project='Lead'))
        db.session.add(ProjectMember(project_id=p2.id, user_id=u3.id, role_in_project='Contributor'))
        
        # AI Team
        db.session.add(ProjectMember(project_id=p3.id, user_id=u2.id, role_in_project='Contributor'))
        db.session.add(ProjectMember(project_id=p3.id, user_id=u3.id, role_in_project='Lead'))

        db.session.commit()

        print("--- SEEDING TASKS & LOGS (Making it look 'lived in') ---")
        
        # Helper to create past logs
        def add_history(task, user, hours, content, day_offset):
            log_date = datetime.utcnow() - timedelta(days=day_offset)
            log = WorkLog(task_id=task.id, user_id=user.id, content=content, hours_spent=hours, timestamp=log_date, date=log_date)
            db.session.add(log)
            # Find decision in content? simplified here

        # P1 Tasks
        t1 = Task(project_id=p1.id, user_id=u2.id, title="Implement Auth0 Login", status="DONE", priority="High")
        t2 = Task(project_id=p1.id, user_id=u1.id, title="GraphQL Schema Design", status="DONE", priority="High")
        t3 = Task(project_id=p1.id, user_id=u2.id, title="Dashboard UI Components", status="IN_PROGRESS", priority="Medium", description="Build widgets for sales stats.")
        t4 = Task(project_id=p1.id, user_id=u1.id, title="Integrate Payment Gateway", status="TODO", priority="High")
        
        db.session.add_all([t1, t2, t3, t4])
        db.session.commit()
        
        # History for P1 (Last 2 weeks)
        add_history(t1, u2, 4, "Setup Auth0 application tenant", 14)
        add_history(t1, u2, 3, "Implemented callback routing", 13)
        add_history(t2, u1, 6, "Designed initial user and product types", 12)
        add_history(t3, u2, 5, "Created chart components using Recharts", 2)
        
        # P2 Tasks
        t5 = Task(project_id=p2.id, user_id=u3.id, title="Dockerize Main App", status="REVIEW", priority="Medium")
        t6 = Task(project_id=p2.id, user_id=u3.id, title="Setup VPC Peering", status="TODO", priority="High")
        
        db.session.add_all([t5, t6])
        db.session.commit()
        
        add_history(t5, u3, 8, "Wrote multi-stage Dockerfile for Python app", 3)

        print("--- SEEDING DECISIONS ---")
        # Decisions showing "Thought Process"
        d1 = Decision(project_id=p1.id, author_id=u1.id, title="Use Apollo Client over Relay", 
                      explanation="We chose Apollo for better documentation and easier integration with existing REST endpoints.",
                      reasoning="Relay has a steeper learning curve and we need to ship v2.0 fast. Apollo offers good caching out of the box.",
                      impact_level="High", timestamp=datetime.utcnow() - timedelta(days=10))
        
        d2 = Decision(project_id=p2.id, author_id=u3.id, title="Select AWS Fargate", 
                      explanation="Serverless container execution.",
                      reasoning="Managing EC2 instances for this scale is overhead we don't need. Fargate costs more but saves DevOps time.",
                      impact_level="Medium", timestamp=datetime.utcnow() - timedelta(days=5))

        db.session.add_all([d1, d2])
        db.session.commit()
        
        print("--- DONE SEEDING ---")
        print(f"Admin User: {admin.email} (ID: {admin.id})")
        print(f"Project 1 ID: {p1.id}")

if __name__ == "__main__":
    seed()
