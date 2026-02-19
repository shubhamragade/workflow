from ..models import Task, WorkLog, User, Project, db, SystemEvent
from datetime import datetime, timedelta
# Prevent circular import - import inline or reorganize. 
# Decision service depends on models. We can use the model directly or better, pass the responsibility.
# For simplicity and structure, let's keep services focused. 
# Better: generic "log_work_and_check_insight" function or just import decision_service inside the function.
from . import decision_service

TASK_TRANSITIONS = {
    'TODO': ['IN_PROGRESS'],
    'IN_PROGRESS': ['REVIEW', 'TODO'],
    'REVIEW': ['DONE', 'IN_PROGRESS'],
    'DONE': []
}

def validate_transition(current_status, new_status):
    if current_status == new_status:
        return True
    return new_status in TASK_TRANSITIONS.get(current_status, [])

def complete_task(task_id, expected_version_id=None):
    """
    Advances the task to the next logical state.
    TODO -> IN_PROGRESS
    IN_PROGRESS -> REVIEW
    REVIEW -> DONE
    """
    task = Task.query.get(task_id)
    if not task:
        return {"error": "NotFound", "message": "Task not found"}, 404
        
    # Optimistic Locking Check
    if expected_version_id is not None:
        if task.version_id != int(expected_version_id):
            return {"error": "Conflict", "message": "Task modified by another user. Refresh and try again.", "current_version": task.version_id}, 409

    next_status = None
    if task.status == 'TODO':
        next_status = 'IN_PROGRESS'
    elif task.status == 'IN_PROGRESS':
        next_status = 'REVIEW'
    elif task.status == 'REVIEW':
        next_status = 'DONE'
    else:
        return {"error": "InvalidState", "message": f"Cannot advance from {task.status}"}, 400

    if not validate_transition(task.status, next_status):
        return {"error": "InvalidTransition", "message": f"Cannot transition from {task.status} to {next_status}"}, 400
        
    # Rule: Cannot mark DONE if no work logs exist
    if next_status == 'DONE' and not task.logs:
        return {"error": "InvalidState", "message": "Cannot mark task DONE / REVIEW APPROVED without logs. Documentation is required."}, 400
        
    task.status = next_status
    
    # Log event
    event = SystemEvent(
        event_type='STATUS_CHANGE',
        description=f"Task {task_id} advanced to {next_status}",
        project_id=task.project_id
    )
    db.session.add(event)
    
    # Auto-calculate project progress
    update_project_progress(task.project_id)
    
    db.session.commit()
    return {"message": f"Task advanced to {next_status}", "new_status": next_status}, 200

def update_task(task_id, expected_version_id=None, **kwargs):
    task = Task.query.get(task_id)
    if not task:
        return {"error": "NotFound", "message": "Task not found"}, 404
        
    # Optimistic Locking Check
    if expected_version_id is not None:
        if task.version_id != int(expected_version_id):
            return {"error": "Conflict", "message": "Data modified by another user. Reload and try again.", "current_version": task.version_id}, 409

    if 'status' in kwargs:
        new_status = kwargs['status']
        if not validate_transition(task.status, new_status):
            return {"error": "InvalidTransition", "message": f"Illegal move: {task.status} -> {new_status}"}, 400
            
    if task.status == 'DONE' and any(k != 'status' for k in kwargs):
        return {"error": "InvalidState", "message": "Cannot modify a DONE task. Create a new task for additional work."}, 400
        
    if 'user_id' in kwargs and kwargs['user_id']:
        user = User.query.get(kwargs['user_id'])
        if user and user.status == 'Inactive':
            return {"error": "InvalidState", "message": "Cannot assign task to inactive member"}, 400
            
    for key, value in kwargs.items():
        if hasattr(task, key):
            if key == 'status' and getattr(task, key) != value:
                # Log status change
                event = SystemEvent(
                    event_type='STATUS_CHANGE',
                    description=f"Task {task_id} status changed from {task.status} to {value}",
                    project_id=task.project_id
                )
                db.session.add(event)
            setattr(task, key, value)
            
    db.session.commit()
    update_project_progress(task.project_id)
    return task, 200

def create_task(project_id, title, user_id=None, priority='Medium', description=""):
    project = Project.query.get(project_id)
    if not project or project.status == 'COMPLETED':
        return {"error": "InvalidState", "message": "Cannot add tasks to completed project"}, 400
        
    if user_id:
        user = User.query.get(user_id)
        if user and user.status == 'Inactive':
            return {"error": "InvalidState", "message": "Cannot assign task to inactive member"}, 400
            
    task = Task(
        project_id=project_id, 
        user_id=user_id, 
        title=title, 
        priority=priority, 
        description=description
    )
    db.session.add(task)
    db.session.commit()
    update_project_progress(project_id)
    return task, 201

def create_work_log(task_id, user_id, content, hours_spent, blockers="", decisions_made=None):
    try:
        task_id = int(task_id)
        user_id = int(user_id)
        hours_spent = float(hours_spent)
    except (ValueError, TypeError):
        return {"error": "InvalidInput", "message": "Invalid ID or hours format"}, 400

    task = Task.query.get(task_id)
    if not task:
        return {"error": "NotFound", "message": "Task not found"}, 404
        
    if task.status == 'DONE':
        return {"error": "InvalidState", "message": "Cannot log for DONE task"}, 400
        
    if hours_spent <= 0:
        return {"error": "InvalidInput", "message": "Hours must be > 0"}, 400
        
    log = WorkLog(
        task_id=task_id, 
        user_id=user_id, 
        content=content, 
        hours_spent=hours_spent, 
        blockers=blockers
    )
    db.session.add(log)
    db.session.commit()
    db.session.add(log)
    db.session.commit()
    update_project_progress(task.project_id)

    if decisions_made:
        # If a strategic pivot point was noted, also record it as an architectural decision
        decision_service.create_decision(
            project_id=task.project_id,
            author_id=user_id,
            title=f"Insight from Task {task_id}",
            explanation=decisions_made,
            reasoning="Derived from tactical work log execution.",
            impact_level="Medium",
            task_id=task_id
        )

    return log, 201

def update_project_progress(project_id):
    project = Project.query.get(project_id)
    total = len(project.tasks)
    if total == 0:
        project.completion_percentage = 0
    else:
        # Calculate weighted progress: DONE=1.0, IN_PROGRESS=0.5
        score = 0
        for t in project.tasks:
            if t.status == 'DONE':
                score += 1.0
            elif t.status == 'IN_PROGRESS':
                score += 0.5
        
        project.completion_percentage = (score / total) * 100
    db.session.add(project)
    db.session.commit()
