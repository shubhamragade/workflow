from . import ma
from marshmallow import fields
from .models import Project, Milestone, Task, WorkLog, Decision

class ProjectSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Project
    id = ma.auto_field()
    name = ma.auto_field()
    description = ma.auto_field()
    completion_percentage = ma.auto_field()

class MilestoneSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Milestone
    id = ma.auto_field()
    title = ma.auto_field()
    status = ma.auto_field()

class TaskSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Task
    id = ma.auto_field()
    title = ma.auto_field()
    user_id = ma.auto_field()
    status = ma.auto_field()
    project_id = ma.auto_field()

class WorkLogSchema(ma.SQLAlchemySchema):
    class Meta:
        model = WorkLog
    id = ma.auto_field()
    content = ma.auto_field()
    blockers = ma.auto_field()
    decisions_made = fields.String(load_only=True) # Not in model, input only
    hours_spent = ma.auto_field()
    task_id = ma.auto_field()

class DecisionSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Decision
    id = ma.auto_field()
    title = ma.auto_field()
    explanation = ma.auto_field()
    impact_level = ma.auto_field()
    project_id = ma.auto_field()

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
log_schema = WorkLogSchema()
logs_schema = WorkLogSchema(many=True)
decision_schema = DecisionSchema()
decisions_schema = DecisionSchema(many=True)
