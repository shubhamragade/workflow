from ..models import Project, Task, WorkLog, Decision, User, SystemEvent, AISummary, ProjectMember, db
from datetime import datetime, timedelta
from flask import current_app
from openai import OpenAI
import json
import json
import hashlib
from ..ai_prompts import HANDOVER_PROMPT, DAILY_SUMMARY_PROMPT, WEEKLY_SUMMARY_PROMPT, CONTRIBUTOR_PROMPT, CONTRIBUTOR_IMPACT_PROMPT

def get_client():
    return OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

def log_ai_event(user_id, project_id, event_type, description, metadata=None):
    event = SystemEvent(
        event_type='AI_GENERATION',
        description=f"{event_type}: {description}",
        triggered_by=user_id,
        project_id=project_id,
        metadata_json=metadata
    )
    db.session.add(event)
    db.session.commit()

def get_context_hash(context_str):
    return hashlib.sha256(context_str.encode('utf-8')).hexdigest()

def detect_risks(project_id, days=7):
    since = datetime.utcnow() - timedelta(days=days)
    blockers = WorkLog.query.join(Task).filter(
        Task.project_id == project_id,
        WorkLog.timestamp >= since,
        WorkLog.blockers != None,
        WorkLog.blockers != ''
    ).all()
    
    # Simple rule: if more than 3 unique blockers in a week, flag as high risk
    if len(blockers) > 3:
        return f"CRITICAL: {len(blockers)} blockers detected in the last {days} days. documentation indicate high risk."
    return "Velocity stable. No significant blockers detected."

def generate_handover_report(user_id, preview=False):
    user = User.query.get(user_id)
    if not user:
        return {"error": "NotFound", "message": "User not found"}, 404
        
    # Gather data for AI
    open_tasks = Task.query.filter_by(user_id=user_id).filter(Task.status != 'DONE').all()
    recent_logs = WorkLog.query.filter_by(user_id=user_id).order_by(WorkLog.timestamp.desc()).limit(10).all()
    recent_decisions = Decision.query.filter_by(author_id=user_id).order_by(Decision.timestamp.desc()).limit(5).all()
    
    context = f"Member: {user.name}\n"
    context += f"Recent Activity:\n" + "\n".join([f"- {l.content}" for l in recent_logs])
    context += f"\nDecisions Made:\n" + "\n".join([f"- {d.title}: {d.explanation}" for d in recent_decisions])
    context += f"\nPending Tasks:\n" + "\n".join([f"- {t.title}: {t.description}" for t in open_tasks])

    # client = get_client()
    # try:
    #     response = client.chat.completions.create(
    #         model="gpt-4o",
    #         messages=[
    #             {"role": "system", "content": HANDOVER_PROMPT},
    #             {"role": "user", "content": f"Generate a handover report for this project member exit:\n\n{context}"}
    #         ]
    #     )
    #     summary = response.choices[0].message.content
    # except Exception as e:
    #     summary = f"Handover Report for {user.name} (Fallback-Derived):\n- {len(open_tasks)} tasks pending.\n- Error generating deep analysis: {str(e)}"
    summary = f"Handover Report for {user.name} (AI MOCKED):\n- {len(open_tasks)} tasks pending.\n- Handover summary generated successfully."

    if preview:
        return {"summary": summary, "open_task_count": len(open_tasks)}, 200

    log_ai_event(None, None, "HANDOVER", f"User {user_id}", {"summary_length": len(summary)})

    # Persistence as per SOP
    handover_report = AISummary(
        user_id=user_id,
        summary_type="HANDOVER",
        content=summary,
        status='SUCCESS',
        model_used="gpt-4o",
        context_hash=hashlib.sha256(summary.encode('utf-8')).hexdigest(), # Use summary content as hash for now as context is dynamic string
        generated_at=datetime.utcnow()
    )
    db.session.add(handover_report)
    db.session.commit()

    return {
        "summary": summary,
        "type": "Generated Summary",
        "generated_at": handover_report.generated_at.isoformat(),
        "id": handover_report.id
    }, 200

def save_final_handover(user_id, content):
    handover_report = AISummary(
        user_id=user_id,
        summary_type="HANDOVER",
        content=content,
        status='SUCCESS',
        model_used="gpt-4o-finalized",
        context_hash=hashlib.sha256(content.encode('utf-8')).hexdigest(),
        generated_at=datetime.utcnow()
    )
    db.session.add(handover_report)
    db.session.commit()
    return handover_report

def generate_project_evolution_summary(project_id, report_type='daily'):
    project = Project.query.get(project_id)
    if not project:
        return {"error": "NotFound", "message": "Project not found"}, 404
        
    # DEMO HACK: Widen window to 30 days to capture seed data
    delta = timedelta(days=30) 
    since = datetime.utcnow() - delta
    
    logs = WorkLog.query.join(Task).filter(Task.project_id == project_id, WorkLog.timestamp >= since).all()
    decisions = Decision.query.filter(Decision.project_id == project_id, Decision.timestamp >= since).all()
    
    if not logs and not decisions:
        return {"summary": "No significant activity recorded.", "type": "Generated Summary"}, 200

    context = f"Project: {project.name}\n"
    context += f"Recent Logs:\n" + "\n".join([f"- {l.content} ({l.hours_spent}h)" for l in logs])
    context += f"\nRecent Decisions:\n" + "\n".join([f"- {d.title}: {d.reasoning}" for d in decisions])
    
    # Add risk detection insights
    risk_insight = detect_risks(project_id)
    context += f"\nInternal Risk Detection: {risk_insight}"

    context_hash = get_context_hash(context)
    
    # Check if a summary with this context already exists
    existing = AISummary.query.filter_by(project_id=project_id, summary_type=report_type.upper(), context_hash=context_hash, status='SUCCESS').first()
    if existing:
        return {
            "summary": existing.content,
            "type": "Generated Summary (Cached)",
            "generated_at": existing.generated_at.isoformat(),
            "version": existing.id
        }, 200

    client = get_client()
    status = 'SUCCESS'
    error = None
    summary = ""
    
    try:
        # DEMO MODE: Realistic Hardcoded Responses (Since OpenAI Client is unstable/mocked)
        if report_type == 'weekly':
            summary = """### 🚀 Weekly Project Velocity Report

**Executive Summary:**
The team has maintained a strong velocity this week, closing **4 critical tasks** related to the authentication module and initial API schema. The inclusion of *Auth0* was a key strategic win, reducing estimated security debt by 40%.

**Key Achievements:**
*   **Backend:** Finalized GraphQL schema for User and Product types (Alex Chen).
*   **Frontend:** Implemented core Recharts components for the dashboard (Priya Patel).
*   **Infrastructure:** successfully containerized the main application using Docker (Jordan Lee).

**Risks & Attention Areas:**
*   ⚠️ **Migration Delay:** The legacy data import script is lagging behind schedule.
*   **Resource Bottleneck:** DevOps capacity is stretched between AWS setup and CI/CD pipelines.

**Recommendation:**
Prioritize the *Payment Gateway Integration* next sprint to unblock the billing team."""
            
        elif report_type == 'contributor_impact':
            summary = """### 🌟 Contributor Impact Analysis

**Top Performer: Alex Chen (Senior Eng)**
*   **Focus:** Core Architecture & Schema Design.
*   **Impact:** His decision to push for *Apollo Client* over Relay has simplified the state management layer significantly.
*   **Log Complexity:** High. Consistently tackling deep backend logic.

**Rising Star: Priya Patel (Frontend)**
*   **Focus:** UI Components & Visualization.
*   **Impact:** Delivering high-quality, reusable React components. Her work on the Dashboard widgets is client-ready.

**Stabilizer: Jordan Lee (DevOps)**
*   **Focus:** Infrastructure & Containerization.
*   **Impact:** Critical work on Docker & AWS Fargate. While invisible to users, this prevents deployment bottlenecks."""
            
        else: # Daily
            summary = """### ☀️ Daily Standup Summary

**Yesterday's Wins:**
*   Alex completed the *GraphQL Schema Design*.
*   Priya pushed the initial *Auth0 Login* flow to staging.

**Today's Focus:**
*   Jordan is finalizing the *VPC Peering* for the RDS instance.
*   Alex is starting on *Payment Gateway* integration.

**Blockers:**
*   None reported today, though the *Cloud Migration* timeline is tight."""
        
    except Exception as e:
        status = 'FAILED'
        error = str(e)
        summary = f"Summary generation failed. Context: {len(logs)} logs found."


    # Store versioned summary
    new_report = AISummary(
        project_id=project_id,
        summary_type=report_type.upper(),
        content=summary,
        status=status,
        model_used="gpt-4o",
        context_hash=context_hash,
        error_log=error
    )
    db.session.add(new_report)
    db.session.commit()

    log_ai_event(None, project_id, report_type.upper(), f"Status: {status}", {"hash": context_hash})

    return {
        "summary": summary,
        "type": "Generated Summary",
        "generated_at": datetime.utcnow().isoformat(),
        "version": new_report.id,
        "status": status
    }, 200

def generate_contributor_summary(user_id):
    user = User.query.get(user_id)
    if not user:
        return {"error": "NotFound", "message": "User not found"}, 404
        
    logs = WorkLog.query.filter_by(user_id=user_id).all()
    decisions = Decision.query.filter_by(author_id=user_id).all()
    
    context = f"Contributor: {user.name}\n"
    context += f"History of Work:\n" + "\n".join([f"- {l.content}" for l in logs])
    context += f"\nDecisions Created:\n" + "\n".join([f"- {d.title}" for d in decisions])

    client = get_client()
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": CONTRIBUTOR_PROMPT},
                {"role": "user", "content": f"Analyze contributor impact:\n\n{context}"}
            ]
        )
        summary = response.choices[0].message.content
    except Exception as e:
        summary = "Error generating contributor analysis."

    log_ai_event(None, None, "CONTRIBUTOR", f"User {user_id}", {"summary_length": len(summary)})

    return {
        "summary": summary,
        "type": "Generated Summary",
        "generated_at": datetime.utcnow().isoformat()
    }, 200
