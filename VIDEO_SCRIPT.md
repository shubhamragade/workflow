# Nexus Video Presentation Script (10-15 Minutes)

**Goal:** Demonstrate that Nexus is not just a CRUD app, but a high-integrity engine for preserving project context.

## ⏱️ Minutes 0-2: Introduction & The Problem (Camera on You)
"Hi, I'm [Your Name], and this is **Nexus**."

*   **The Problem:** "We've all seen projects fail not because of bad code, but because of lost context. A senior engineer leaves, and 80% of the project's 'why' walks out the door with them."
*   **The Solution:** "Nexus is an AI-driven project management system designed to treat *Project Memory* as a first-class citizen. It enforces documentation at the source and uses AI to turn raw logs into meaningful narratives."

## ⏱️ Minutes 2-5: System Structure & Tech Stack (Screen Share: VS Code)
"Let's look at how I built it."

*   **Why this Stack?**
    *   "I chose **React + Vite + Tailwind** for the frontend to create a 'Glassmorphism' UI that reduces visual noise."
    *   "For the backend, I used **Flask + SQLAlchemy**. I specifically utilized a **Service Layer Architecture**."
*   **Code Tour:**
    *   *Open `backend/app/services/task_service.py`*: "Notice how business logic isn't in the routes. It's here. This allows me to enforce rules like 'No Done without Work Logs' regardless of the API endpoint."
    *   *Open `backend/app/models.py`*: "I use strictly typed Enums and CheckConstraint to ensure data integrity at the database level."

## ⏱️ Minutes 5-10: Live Demo (Screen Share: Browser)
"Now, let's see it in action."

### 1. The Dashboard (1 min)
*   *Navigate to Dashboard.*
*   "This gives me a pulse on the organization. I can see active projects and real-time velocity."

### 2. Task Lifecycle & Concurrency (2 mins)
*   *Navigate to Project -> Customer Portal.*
*   "I'll move a task to 'In Progress'. Now, watch what happens if I try to cheat the system."
*   *Try to move to DONE without a log (if UI blocks it, mention it. If backend blocks it, show the error).*
*   **The Concurrency Demo:** "Project management is collaborative. What if two people edit the same task?"
    *   "I implemented **Optimistic Locking** using a version column."
    *   *(Optional: Show the code snippet for `version_id` check).* "This prevents the 'Lost Update' problem without complex websockets."

### 3. AI Usage: The "Wow" Factor (2 mins)
*   *Navigate to 'AI Status Reports'.*
*   "This is where Nexus shines. Most tools just dump data. Nexus reads the logs."
*   *Generate a 'Weekly Recap'.*
*   "Look at this. It's not hallucinating. It's referencing specific logs from Alex and Priya. It identifies risks—like the blocked payment gateway."
*   **Key Point:** "I designed the AI to be **Read-Only**. It summarizes; it never invents."

## ⏱️ Minutes 10-13: Deep Dive: Risks & Extensions (Screen Share: VS Code / Slides)
"Building this wasn't just about features; it was about handling risks."

### 1. Risks & Mitigations
*   **Data Integrity:** "I used State Machines to prevent invalid transitions."
*   **Knowledge Loss:** "I built an 'Exit Protocol'. You physically cannot mark a user as inactive until their tasks are reassigned and the AI generates a handover report."

### 2. Extension Approach
"How do we grow this?"
*   "Because of the Service Layer, adding a new feature—like 'Sprints'—is easy. I'd create a `SprintService` and link it to Tasks. The core constraints remain untouched."
*   "For AI, I can swap the model in `ai_service.py` without breaking the application logic."

## ⏱️ Minutes 13-15: Conclusion
"Nexus is my answer to the 'Bus Factor' problem. It combines strict engineering standards with modern AI to ensure that even if people leave, the knowledge stays."

"Thank you."
