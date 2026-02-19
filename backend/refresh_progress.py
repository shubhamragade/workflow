from app import create_app
from app.services.task_service import update_project_progress
from app.models import Project

app = create_app()
with app.app_context():
    projects = Project.query.all()
    for p in projects:
        update_project_progress(p.id)
        print(f"Refreshed progress for Project {p.id}: {p.completion_percentage}%")
