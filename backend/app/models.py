from datetime import datetime
from . import db
from sqlalchemy import Enum, CheckConstraint
import enum
import hashlib

class UserRole(enum.Enum):
    ADMIN = "Admin"
    MEMBER = "Member"

class UserStatus(enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class ProjectMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    role_in_project = db.Column(db.String(50), default="Contributor") # Lead, Contributor, Observer

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128)) # Added for secure auth
    role = db.Column(db.String(20), default='Member') # Keep as string for simple RBAC, but validated by Enum
    status = db.Column(db.String(20), default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    logs = db.relationship('WorkLog', backref='user', lazy=True)
    assigned_tasks = db.relationship('Task', backref='assignee', lazy=True)
    project_memberships = db.relationship('ProjectMember', backref='user', lazy=True)

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    target_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE, COMPLETED
    
    tasks = db.relationship('Task', backref='milestone', lazy=True)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    target_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE, COMPLETED
    completion_percentage = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tasks = db.relationship('Task', backref='project', lazy=True)
    decisions = db.relationship('Decision', backref='project', lazy=True)
    milestones = db.relationship('Milestone', backref='project', lazy=True)
    members = db.relationship('ProjectMember', backref='project', lazy=True)

class TaskStatus(enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    milestone_id = db.Column(db.Integer, db.ForeignKey('milestone.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium') # Low, Medium, High
    status = db.Column(db.String(20), default='TODO') # State Machine enforced in service
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    logs = db.relationship('WorkLog', backref='task', lazy=True)
    decisions = db.relationship('Decision', backref='task', lazy=True)

    version_id = db.Column(db.Integer, nullable=False, default=1)
    __mapper_args__ = {
        "version_id_col": version_id
    }

class SystemEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False) # STATUS_CHANGE, DECISION_CREATED, AI_GENERATION
    description = db.Column(db.Text)
    triggered_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    metadata_json = db.Column(db.JSON) # For token usage, status values, etc.

class WorkLog(db.Model):
    __table_args__ = (
        CheckConstraint('hours_spent > 0', name='check_hours_positive'),
    )
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    blockers = db.Column(db.Text)
    hours_spent = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class AIReportStatus(enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"

class AISummary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    summary_type = db.Column(db.String(50), nullable=False) # DAILY, WEEKLY, HANDOVER, CONTRIBUTOR
    content = db.Column(db.Text)
    status = db.Column(db.String(20), default='SUCCESS')
    model_used = db.Column(db.String(50))
    context_hash = db.Column(db.String(64)) # To detect if data has changed
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    error_log = db.Column(db.Text)

class Decision(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    reasoning = db.Column(db.Text, nullable=False)
    impact_level = db.Column(db.String(20)) # Low, Medium, High
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    author = db.relationship('User', backref='decisions')

    version_id = db.Column(db.Integer, nullable=False, default=1)
    __mapper_args__ = {
        "version_id_col": version_id
    }
