from ..models import Decision, db, SystemEvent

def create_decision(project_id, author_id, title, explanation, reasoning, impact_level, task_id=None):
    decision = Decision(
        project_id=project_id,
        author_id=author_id,
        title=title,
        explanation=explanation,
        reasoning=reasoning,
        impact_level=impact_level,
        task_id=task_id
    )
    db.session.add(decision)
    
    # Log event
    event = SystemEvent(
        event_type='DECISION_CREATED',
        description=f"Decision created: {title}",
        triggered_by=author_id,
        project_id=project_id
    )
    db.session.add(event)
    
    db.session.commit()
    return decision, 201

def update_decision(decision_id, **kwargs):
    decision = Decision.query.get(decision_id)
    if not decision:
        return {"error": "NotFound", "message": "Decision not found"}, 404
        
    # Rule: Decision cannot be edited after 24 hours
    if datetime.utcnow() > decision.timestamp + timedelta(hours=24):
        return {"error": "InvalidState", "message": "Decision cannot be edited after 24 hours"}, 403
        
    for key, value in kwargs.items():
        setattr(decision, key, value)
    
    db.session.commit()
    return decision, 200

def delete_decision(decision_id):
    # Rule: Cannot delete decision
    return {"error": "OperationNotPermitted", "message": "Decisions are immutable and cannot be deleted"}, 403
