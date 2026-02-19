import pytest
from app import create_app, db
from app.models import Project, Task, WorkLog, Decision, User
from app.services import task_service, decision_service, ai_service
from datetime import datetime, timedelta

@pytest.fixture
def app():
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    app.config['OPENAI_API_KEY'] = 'test-key'
    
    with app.app_context():
        db.create_all()
        # Seed test user
        user = User(name="Admin", email="admin@test.com", role="Admin")
        db.session.add(user)
        db.session.commit()
        yield app
        db.drop_all()

def test_cannot_mark_task_done_without_logs(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        
        t, _ = task_service.create_task(p.id, "Task 1")
        
        # Invariant: Cannot mark DONE without logs
        res, status = task_service.complete_task(t.id)
        assert status == 400
        assert "without logs" in res['message']

def test_cannot_log_on_done_task(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        
        t, _ = task_service.create_task(p.id, "Task 1")
        task_service.create_work_log(t.id, 1, "Initial work", 1.0)
        task_service.complete_task(t.id)
        
        # Invariant: Cannot log on DONE task
        res, status = task_service.create_work_log(t.id, 1, "Late log", 1.0)
        assert status == 400
        assert "Cannot log for DONE task" in res['message']

def test_decision_immutability_rule(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        
        d, _ = decision_service.create_decision(p.id, 1, "Title", "Expl", "Reasoning", "High")
        
        # Manually backdate for test
        d.timestamp = datetime.utcnow() - timedelta(hours=25)
        db.session.commit()
        
        # Invariant: Decision immutable after 24h
        res, status = decision_service.update_decision(d.id, title="Changed")
        assert status == 403
        assert "cannot be edited after 24 hours" in res['message']

def test_invalid_project_state_task_creation(app):
    with app.app_context():
        p = Project(name="P1", status='COMPLETED')
        db.session.add(p)
        db.session.commit()
        
        # Invariant: Cannot add tasks to completed project
        res, status = task_service.create_task(p.id, "Task in done project")
        assert status == 400
        assert "completed project" in res['message']

def test_ai_summary_generation_with_empty_logs(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        
        # Invariant: Graceful handling of empty logs for AI
        res, status = ai_service.generate_project_evolution_summary(p.id)
        assert status == 200
        assert "No significant activity" in res['summary']
        assert res['type'] == "Generated Summary"

def test_illegal_state_transition(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        
        t, _ = task_service.create_task(p.id, "Task 1")
        
        # Current: TODO. Try illegal move (e.g., TODO -> DONE if map says skip)
        # Note: Valid: TODO -> DONE, but Terminal: DONE has no out.
        task_service.create_work_log(t.id, 1, "Log", 1.0)
        task_service.complete_task(t.id)
        
        # Invariant: DONE is terminal. Try to go back to IN_PROGRESS.
        res, status = task_service.update_task(t.id, status='IN_PROGRESS')
        assert status == 400
        assert "Illegal move" in res['message']

def test_schema_hours_constraint(app):
    with app.app_context():
        p = Project(name="P1")
        db.session.add(p)
        db.session.commit()
        t, _ = task_service.create_task(p.id, "Task 1")
        
        # Invariant: Hours must be > 0 (checked at service and DB)
        res, status = task_service.create_work_log(t.id, 1, "Log", -5.0)
        assert status == 400
        assert "must be > 0" in res['message']
