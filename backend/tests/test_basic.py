import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.models import Project, Task, WorkLog, db
from app.services import task_service

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

def test_logic_directly(app):
    with app.app_context():
        # Create project
        p = Project(name="Test")
        db.session.add(p)
        db.session.commit()
        
        # Create task
        t = Task(project_id=p.id, title="Task")
        db.session.add(t)
        db.session.commit()
        
        # Rule: No completion without log
        res, status = task_service.complete_task(t.id)
        assert status == 400
        
        # Add log
        task_service.create_work_log(t.id, content="Log")
        
        # Rule: Completion works with log
        res, status = task_service.complete_task(t.id)
        assert status == 200
        assert Task.query.get(t.id).status == 'Completed'
