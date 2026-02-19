import hashlib
from datetime import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from . import db
from sqlalchemy.orm.exc import StaleDataError
from .models import Project, Task, WorkLog, Decision, User, Milestone, SystemEvent, ProjectMember
from .schemas import task_schema, log_schema
from marshmallow import ValidationError
from .services import task_service, decision_service, ai_service

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.errorhandler(StaleDataError)
def handle_stale_data_error(e):
    return jsonify({"error": "Conflict", "message": "Data has been modified by another user. Please refresh and try again."}), 409

def requires_role(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # For simplicity, we assume user_id is passed in headers or skip real auth
            # In a real app, this would check the session/token
            user_id = request.headers.get('X-User-ID')
            if not user_id:
                return jsonify({"error": "Unauthorized", "message": "X-User-ID header required"}), 401
            user = User.query.get(user_id)
            if not user or (role == 'Admin' and user.role != 'Admin'):
                return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_system_event(event_type, description, user_id=None, project_id=None, metadata=None):
    event = SystemEvent(
        event_type=event_type,
        description=description,
        triggered_by=user_id,
        project_id=project_id,
        metadata_json=metadata
    )
    db.session.add(event)
    db.session.commit()

@bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id, "name": u.name, "email": u.email, 
        "role": u.role, "status": u.status,
        "projects": [m.project.name for m in u.project_memberships]
    } for u in users])

@bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(name=data['name'], email=data['email'], role=data.get('role', 'Member'))
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": user.id, "name": user.name}), 201

@bp.route('/users/<int:user_id>/status', methods=['PATCH'])
def update_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "NotFound"}), 404
        
    start_status = user.status
    new_status = request.json.get('status')
    
    # ENFORCEMENT: Cannot set Inactive directly if tasks exist
    if new_status == 'Inactive' and start_status != 'Inactive':
        open_tasks = Task.query.filter_by(user_id=user_id).filter(Task.status != 'DONE').count()
        if open_tasks > 0:
            return jsonify({
                "error": "ExitBlocked", 
                "message": f"Cannot mark user Inactive. {open_tasks} open tasks detected. Use /exit/initiate workflow."
            }), 400

    user.status = new_status
    db.session.commit()
    
    return jsonify({"message": f"User status updated to {new_status}"})

@bp.route('/users/<int:user_id>/exit/initiate', methods=['POST'])
def initiate_exit(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "NotFound"}), 404
        
    open_tasks = Task.query.filter_by(user_id=user_id).filter(Task.status != 'DONE').all()
    
    # Generate Preview
    ai_result, _ = ai_service.generate_handover_report(user_id, preview=True)
    # ai_result = {'summary': "AI Service Disabled for Debugging"}
    
    return jsonify({
        "user_id": user.id,
        "name": user.name,
        "open_task_count": len(open_tasks),
        "open_tasks": [{"id": t.id, "title": t.title, "priority": t.priority} for t in open_tasks],
        "handover_summary_preview": ai_result['summary'],
        "can_exit_immediately": len(open_tasks) == 0
    })

@bp.route('/users/<int:user_id>/exit/confirm', methods=['POST'])
def confirm_exit(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "NotFound"}), 404
        
    data = request.json
    reassignments = data.get('reassignments', {}) # {taskId: newUserId}
    
    open_tasks = Task.query.filter_by(user_id=user_id).filter(Task.status != 'DONE').all()
    
    # Validate all tasks are covered
    for task in open_tasks:
        if str(task.id) not in reassignments and task.id not in reassignments: 
             return jsonify({"error": "ValidationFailed", "message": f"Task {task.id} must be reassigned."}), 400
             
    # Process Reassignments
    for task_id, new_user_id in reassignments.items():
        task = Task.query.get(task_id)
        if task:
            task.user_id = new_user_id
            log_system_event('TASK_REASSIGNED', f"Task {task.id} reassigned from {user.name} during exit.", request.headers.get('X-User-ID'))
            
    # Save Final Handover
    summary_content = data.get('handover_summary')
    if summary_content:
        ai_service.save_final_handover(user_id, summary_content)
        
    # Finalize Status
    user.status = 'Inactive'
    log_system_event('USER_EXIT', f"User {user.name} exit finalized. Account Inactive.", request.headers.get('X-User-ID'))
    
    db.session.commit()
    return jsonify({"message": "Exit process complete. User is now Inactive."})

@bp.route('/projects/<int:project_id>/summary', methods=['POST'])
def generate_project_summary(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "NotFound"}), 404
        
    report_type = request.json.get('type', 'daily') # 'daily' or 'weekly'
    
    # Generate Summary
    summary_data, status_code = ai_service.generate_project_evolution_summary(project_id, report_type)
    return jsonify(summary_data), status_code

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password') # In a real app, use hashing!
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found"}), 401
    
    # Simple check for now as requested for speed, usually use check_password_hash
    if user.password_hash and user.password_hash != hashlib.sha256(password.encode()).hexdigest():
        return jsonify({"error": "Unauthorized", "message": "Invalid credentials"}), 401
        
    return jsonify({
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "email": user.email
    })

@bp.route('/projects', methods=['POST'])
@requires_role('Admin')
def create_project():
    data = request.json
    project = Project(name=data['name'], description=data.get('description'))
    db.session.add(project)
    db.session.flush() # Get project ID
    
    # Auto-assign creator as Admin of this project
    user_id = request.headers.get('X-User-ID')
    if user_id:
        membership = ProjectMember(project_id=project.id, user_id=user_id, role_in_project='Lead')
        db.session.add(membership)
        
    db.session.commit()
    log_system_event('PROJECT_CREATED', f"Project {project.name} created", user_id, project.id)
    return jsonify({"id": project.id, "name": project.name}), 201

# --- Project Membership ---
@bp.route('/projects/<int:project_id>/members', methods=['POST'])
@requires_role('Admin')
def add_project_member(project_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role', 'Contributor')
    
    existing = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if existing:
        return jsonify({"error": "Conflict", "message": "User already in project"}), 409
        
    membership = ProjectMember(project_id=project_id, user_id=user_id, role_in_project=role)
    db.session.add(membership)
    db.session.commit()
    return jsonify({"message": "Member assigned to project"}), 201

@bp.route('/projects/<int:project_id>/members', methods=['GET'])
def get_project_members(project_id):
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify([{
        "user_id": m.user_id,
        "name": m.user.name,
        "role": m.role_in_project,
        "email": m.user.email
    } for m in members])

@bp.route('/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    return jsonify([{
        "id": p.id, "name": p.name, 
        "completion_percentage": p.completion_percentage,
        "status": p.status,
        "member_count": len(p.members)
    } for p in projects])

# --- Milestones ---
@bp.route('/projects/<int:project_id>/milestones', methods=['POST'])
@requires_role('Admin')
def create_milestone(project_id):
    data = request.json
    milestone = Milestone(
        project_id=project_id,
        title=data['title'],
        description=data.get('description'),
        target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify({"id": milestone.id, "title": milestone.title}), 201

# --- Tasks ---
@bp.route('/tasks', methods=['POST'])
def create_task():
    try:
        # Validate input
        data = task_schema.load(request.json, partial=True) # Partial allows skipping auto-fields like ID
        # Note: partial=True used cautiously, ideally strict schema for creation
    except ValidationError as err:
        return jsonify({"error": "ValidationFailed", "message": err.messages}), 400

    result, status_code = task_service.create_task(
        data.get('project_id'), 
        data.get('title'), 
        data.get('user_id'),
        data.get('priority', 'Medium'),
        data.get('description', '')
    )
    if status_code == 201:
        return jsonify({"id": result.id, "title": result.title}), 201
    return jsonify(result), status_code

@bp.route('/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('project_id', type=int)
    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    tasks = query.all()
    return jsonify([{
        "id": t.id, "title": t.title, "status": t.status, 
        "priority": t.priority, "user_id": t.user_id,
        "assignee_name": t.assignee.name if t.assignee else 'Unassigned',
        "project_id": t.project_id, "description": t.description,
        "version_id": t.version_id
    } for t in tasks])

@bp.route('/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    data = request.json or {}
    expected_version = data.get('version_id')
    result, status_code = task_service.complete_task(task_id, expected_version_id=expected_version)
    if status_code == 200:
        return jsonify(result), 200
    return jsonify(result), status_code

# --- Work Logs ---
@bp.route('/logs', methods=['POST'])
def create_log():
    data = request.json
    if not all(k in data for k in ['task_id', 'user_id', 'content', 'hours_spent']):
        return jsonify({"error": "MissingRequiredFields", "message": "Task, contributor, content, and hours are required."}), 400

    result, status_code = task_service.create_work_log(
        data['task_id'],
        data['user_id'],
        data['content'],
        data['hours_spent'],
        data.get('blockers', ''),
        data.get('decisions_made')
    )

    if status_code == 201:
        return jsonify({"id": result.id}), 201
    return jsonify(result), status_code

@bp.route('/logs', methods=['GET'])
def get_logs():
    task_id = request.args.get('task_id', type=int)
    query = WorkLog.query
    if task_id:
        query = query.filter_by(task_id=task_id)
    logs = query.all()
    return jsonify([{
        "id": l.id, "task_id": l.task_id, "content": l.content,
        "hours_spent": l.hours_spent, "timestamp": l.timestamp.isoformat(),
        "user_id": l.user_id, "blockers": l.blockers
    } for l in logs])

# --- Decisions ---
@bp.route('/decisions', methods=['POST'])
def create_decision():
    data = request.json
    result, status_code = decision_service.create_decision(
        data['project_id'],
        data['author_id'],
        data['title'],
        data['explanation'],
        data['reasoning'],
        data['impact_level'],
        data.get('task_id')
    )
    if status_code == 201:
        return jsonify({"id": result.id, "title": result.title}), 201
    return jsonify(result), status_code

@bp.route('/decisions', methods=['GET'])
def get_decisions():
    project_id = request.args.get('project_id', type=int)
    query = Decision.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    decisions = query.order_by(Decision.timestamp.desc()).all()
    return jsonify([{
        "id": d.id, "title": d.title, "reasoning": d.reasoning,
        "impact_level": d.impact_level, "timestamp": d.timestamp.isoformat(),
        "author": {"id": d.author_id, "name": User.query.get(d.author_id).name if User.query.get(d.author_id) else "Unknown"}
    } for d in decisions])


# --- Stats & Overview ---
@bp.route('/stats/overview', methods=['GET'])
def get_global_stats():
    total_tasks = Task.query.count()
    done_tasks = Task.query.filter_by(status='DONE').count()
    total_hours = db.session.query(db.func.sum(WorkLog.hours_spent)).scalar() or 0
    active_contributors = User.query.filter_by(status='Active').count()
    
    return jsonify({
        "totalTasks": total_tasks,
        "doneTasks": done_tasks,
        "totalHours": float(total_hours),
        "contributors": active_contributors
    })

@bp.route('/projects/<int:project_id>/stats', methods=['GET'])
def get_project_stats(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "NotFound", "message": "Project not found"}), 404
        
    total_tasks = len(project.tasks)
    done_tasks = len([t for t in project.tasks if t.status == 'DONE'])
    total_hours = db.session.query(db.func.sum(WorkLog.hours_spent)).join(Task).filter(Task.project_id == project_id).scalar() or 0
    
    # Calculate Velocity: Tasks done per week since project start
    start_date = project.start_date
    weeks_active = max(1, (datetime.utcnow() - start_date).days / 7)
    velocity = done_tasks / weeks_active

    # Milestone hours
    milestone_stats = []
    for m in project.milestones:
        m_hours = db.session.query(db.func.sum(WorkLog.hours_spent)).join(Task).filter(Task.milestone_id == m.id).scalar() or 0
        milestone_stats.append({
            "id": m.id,
            "title": m.title,
            "hours": float(m_hours)
        })
    
    return jsonify({
        "totalTasks": total_tasks,
        "doneTasks": done_tasks,
        "totalHours": float(total_hours),
        "completionPercentage": project.completion_percentage,
        "velocity": round(velocity, 2),
        "milestones": milestone_stats
    })

@bp.route('/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "NotFound"}), 404
        
    tasks_done = Task.query.filter_by(user_id=user_id, status='DONE').count()
    total_hours = db.session.query(db.func.sum(WorkLog.hours_spent)).filter(WorkLog.user_id == user_id).scalar() or 0
    decisions_made = Decision.query.filter_by(author_id=user_id).count()
    logs_created = WorkLog.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "tasksDone": tasks_done,
        "totalHours": float(total_hours),
        "decisionsMade": decisions_made,
        "logsCreated": logs_created
    })

# --- AI Summaries ---
@bp.route('/projects/<int:project_id>/summary', methods=['GET'])
def get_project_summary(project_id):
    report_type = request.args.get('type', 'daily')
    result, status_code = ai_service.generate_project_evolution_summary(project_id, report_type)
    return jsonify(result), status_code

@bp.route('/users/<int:user_id>/summary', methods=['GET'])
def get_contributor_summary(user_id):
    result, status_code = ai_service.generate_contributor_summary(user_id)
    return jsonify(result), status_code

@bp.route('/users/<int:user_id>/handover', methods=['POST'])
@requires_role('Admin')
def trigger_handover(user_id):
    result, status_code = ai_service.generate_handover_report(user_id)
    return jsonify(result), status_code

@bp.route('/tasks/<int:task_id>', methods=['PATCH'])
def update_task_route(task_id):
    data = request.json
    expected_version = data.pop('version_id', None)
    result, status_code = task_service.update_task(task_id, expected_version_id=expected_version, **data)
    if status_code == 200:
        log_system_event('TASK_UPDATED', f"Task {task_id} updated", request.headers.get('X-User-ID'), result.project_id)
        return jsonify({"id": result.id, "title": result.title, "version_id": result.version_id}), 200
    return jsonify(result), status_code

@bp.route('/events', methods=['GET'])
@requires_role('Admin')
def get_events():
    events = SystemEvent.query.order_by(SystemEvent.timestamp.desc()).limit(50).all()
    return jsonify([{
        "id": e.id,
        "type": e.event_type,
        "description": e.description,
        "triggered_by": e.triggered_by,
        "timestamp": e.timestamp.isoformat(),
        "metadata": e.metadata_json
    } for e in events])
