import hashlib
from app import create_app, db
from app.models import User

def seed():
    app = create_app()
    with app.app_context():
        # Force schema update
        db.drop_all()
        db.create_all()
        
        admin_email = "admin@nexus.ai"
        hashed_pw = hashlib.sha256("admin123".encode()).hexdigest()
        
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(
                name="System Admin",
                email=admin_email,
                password_hash=hashed_pw,
                role="Admin",
                status="Active"
            )
            db.session.add(admin)
            print(f"Created Admin: {admin.name}")
        else:
            admin.password_hash = hashed_pw
            print(f"Updated Admin: {admin.name}")

        # Seed a Member
        member_email = "member@nexus.ai"
        member_pw = hashlib.sha256("member123".encode()).hexdigest()
        member = User.query.filter_by(email=member_email).first()
        if not member:
            member = User(
                name="Regular Member",
                email=member_email,
                password_hash=member_pw,
                role="Member",
                status="Active"
            )
            db.session.add(member)
            print(f"Created Member: {member.name}")
        else:
            member.password_hash = member_pw
            print(f"Updated Member: {member.name}")
            
        db.session.commit()

        # Seed Demo Project
        project = Project.query.filter_by(name="Nexus MVP").first()
        if not project:
            project = Project(
                name="Nexus MVP",
                description="Core platform for high-fidelity context capture and AI-driven handovers.",
                status="ACTIVE"
            )
            db.session.add(project)
            db.session.flush()
            print(f"Created Project: {project.name}")
        
        # Seed Memberships
        if not ProjectMember.query.filter_by(project_id=project.id, user_id=admin.id).first():
            db.session.add(ProjectMember(project_id=project.id, user_id=admin.id, role_in_project="Lead"))
        if not ProjectMember.query.filter_by(project_id=project.id, user_id=member.id).first():
            db.session.add(ProjectMember(project_id=project.id, user_id=member.id, role_in_project="Contributor"))

        # Seed Tasks
        if not Task.query.filter_by(project_id=project.id).first():
            task1 = Task(
                project_id=project.id,
                user_id=member.id,
                title="Implement Auth Flow",
                description="Connect frontend login to backend JWT/Session provider.",
                priority="High",
                status="IN_PROGRESS"
            )
            task2 = Task(
                project_id=project.id,
                user_id=admin.id,
                title="Architect AI Service",
                description="Design the induction layer for knowledge graph updates.",
                priority="Medium",
                status="TODO"
            )
            db.session.add_all([task1, task2])
            print("Created Demo Tasks")

        db.session.commit()

from app.models import ProjectMember, Task, Project

if __name__ == "__main__":
    seed()
