# Nexus Project Walkthrough

## 1. System Structure
### Architecture Overview
Nexus is a full-stack application designed for high-integrity project management.
*   **Frontend:** React (Vite) + Tailwind CSS.
    *   Key Pages: `Projects`, `Tasks` (Kanban), `Summaries` (AI Reports).
    *   Theme: Glassmorphism (Dark Mode) for focus.
*   **Backend:** Python (Flask) + SQLAlchemy (SQLite).
    *   Models: `User`, `Project`, `Task`, `WorkLog`, `Decision`.
    *   Services: Isolated logic in `services/` (e.g., `task_service.py` handles state transitions).
*   **AI Layer:** OpenAI Integration.
    *   Responsible for generating Daily/Weekly reports and Handover protocols.

## 2. AI Usage & Strategy
Nexus uses AI as a **Reading Tool**, not a Writing Tool.
*   **Input:** Structured data (Logs, Decisions) + "Context Hash" (to prevent re-generating identical summaries).
*   **Output:** Markdown-formatted summaries (`Daily Standup`, `Weekly Velocity`, `Contributor Impact`).
*   **Prompting Strategy:**
    *   **Persona:** "Senior Technical Program Manager".
    *   **Constraint:** "No Hallucinations". The AI is explicitly instructed to only use the provided context.
    *   **Format:** Strict Markdown headers and lists for readability.

## 3. Risks & Mitigations
### Technical Risks
*   **Concurrency:** Two users editing the same task.
    *   *Mitigation:* **Optimistic Locking** (`version_id`). If the version on the client doesn't match the server, the update is rejected (409 Conflict).
*   **Data Integrity:** Invalid states (e.g., specific task transitions).
    *   *Mitigation:* **Strict State Machine**. Tasks cannot move to `DONE` without work logs.

### Business Risks
*   **Knowledge Loss:** Employees leaving without documentation.
    *   *Mitigation:* **Exit Workflow**. The system physically prevents marking a user `Inactive` until their tasks are reassigned and an AI Handover Report is generated.

## 4. Extension Approach
Nexus is built to scale without breaking core invariants.
*   **New Features:** Add as new modules in `backend/app/services/`.
*   **Schema Changes:** Use standard Alembic migrations (or `db.create_all()` for this MVP).
*   **Adding AI Capabilities:**
    *   Update `ai_prompts.py` to add new prompt templates.
    *   Add a new route in `routes.py` to expose the capability.
    *   Ensure the AI remains "Read-Only" (never modifying DB state directly).

---
*See `WORKFLOW.md` for the detailed user journey.*
