# AI Guidance & Engineering Standards for Nexus

**Purpose:** This document defines the **Coding Standards, Constraints, and AI Prompting Rules** for the Nexus project. All contributors (human and AI) must adhere to these guidelines.

## 1. System Philosophy (The "Why")
*   **Trust > Speed:** We prioritize data integrity over rapid feature delivery. Never bypass validation logic.
*   **Context Preservation:** The goal of Nexus is to capture the "why" behind decisions. All logs and summaries must reflect this narrative depth, not just raw stats.

## 2. Coding Standards
### Backend (Flask + SQLAlchemy)
*   **Architecture:** Use a Service Layer pattern.
    *   `routes.py`: Handle HTTP request/response only.
    *   `services/*.py`: Contain all business logic and cross-model interactions.
    *   `models.py`: Define schema and relationships.
*   **Type Safety:** Use Pydantic or Marshmallow for input/output validation. Do not rely on implicit JSON structures.
*   **Database:** Use SQLAlchemy ORM unless raw SQL is strictly necessary for performance (document why).
    *   **Enforce Constraints:** Use `CheckConstraint` and `Enum` types in the DB schema.

### Frontend (React + Vite + Tailwind)
*   **Component Structure:**
    *   Feature-based organization (e.g., `pages/Tasks.jsx` handles all task views).
    *   Small, reusable UI components (e.g., `components/Badge.jsx`).
*   **Styling:**
    *   Use Tailwind utility classes exclusively. Avoid custom CSS files unless overriding third-party libraries.
    *   Dark mode first design ("Glassmorphism").
*   **State Management:**
    *   Use React Context for global state (Auth).
    *   Use standard hooks (`useState`, `useEffect`) for local state. Avoid over-engineering with Redux unless required.

## 3. AI Agent Constraints
### What You Can Do
*   **Summarize:** Read logs, tasks, and decisions to generate human-readable reports.
*   **Suggest:** Propose code refactors or optimizations based on the standards above.
*   **Explain:** Clarify existing code logic.

### What You CANNOT Do
*   **Invent Data:** Never hallucinate project metrics or user activity. If data is missing, state "No data available."
*   **Modify without Review:** You cannot commit code or run destructive database commands (`DROP`, `DELETE`) without explicit user confirmation.
*   **Bypass Security:** Do not implement features that skip authentication or authorization checks.

## 4. Prompting Rules (For AI Features)
*   **Tone:** Professional, direct, and slightly formal.
*   **Output Format:** Markdown (headers, bullet points, bold text).
*   **Context Window:** Always look back at least 30 days for project context.
*   **Persona:** Act as a "Senior Technical Program Manager"—focus on risks, blockers, and velocity.
