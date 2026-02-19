# Nexus: AI-Driven Project Management & Knowledge Retention System

## 1. The Real-World Problem: Silent Knowledge Loss & Accountability Gaps
In fast-growing companies, projects often suffer from "silent failure." Status updates are vague ("working on it"), critical decisions are made in fleeting Slack chats, and when a key employee leaves, they take 80% of the project context with them. The result is a cycle of re-work, lost intellectual property, and projects that drift without clear accountability.

## 2. Why Existing Tools Fail
Traditional tools like Jira or Asana excel at tracking *what* needs to be done, but fail to capture *why* and *how*.
-   **No Context:** A "Done" ticket tells you nothing about the trade-offs made during implementation.
-   **No Gatekeeping:** Tasks can be marked complete without documentation, leading to technical debt.
-   **Manual Reporting:** Managers spend hours chasing team members for updates that are often outdated by the time they are read.
-   **Violent Exits:** When an employee leaves, their tasks are often orphaned, and their unwritten knowledge is lost forever.

## 3. How Nexus Manages the Complete Project Lifecycle
This system enforces a structured, high-integrity workflow from inception to delivery:
-   **Creation:** Managers define Projects and assign Tasks with clear priorities.
-   **Execution (The "Work Log" Gate):** Unlike standard tools, **users cannot mark a task as DONE without logging work.** This simple friction point ensures every completed unit of value has associated documentation.
-   **Review:** A dedicated "Review" workflow state (`TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`) ensures quality control before a task is closed.
-   **Immutability:** Once a Decision is recorded (e.g., "We chose PostgreSQL over Mongo"), it becomes immutable. This prevents "historical revisionism" and clearly documents the architectural path.

## 4. Preserving Long-Term Project Memory
Nexus treats **Project Memory** as a first-class citizen, not a byproduct.
-   **AI-Powered Summarization:** The system reads daily work logs and decisions to auto-generate:
    -   **Daily Standups:** What did the team achieve today? (Triggered via `/projects/{id}/summary`)
    -   **Weekly Reports:** Are we on track? What are the blockers?
-   **Decision Repository:** A centralized, searchable log of every key technical and product decision, ensuring that future team members understand the context behind legacy code.

## 5. Preventing Knowledge Loss During Employee Exit
The "Employee Exit Workflow" is a critical compliance feature designed to secure intellectual property.
-   **The Exit Block:** An admin *cannot* mark a user as `Inactive` if they have open tasks. The system physically prevents the "offboarding oversight."
-   **Forced Reassignment:** The workflow forces the admin to explicitly reassign every open task to a new owner before the exit can proceed.
-   **AI Handover Witness:** Upon exit initiation, the AI generates a **Human-Readable Exit Report** by synthesizing the departing employee's:
    -   Open Tasks (now reassigned)
    -   Recent Work Logs
    -   Key Decisions authored
    This report acts as an automated "knowledge transfer" document, ensuring the new assignee hits the ground running.

## 6. Value for Growing Companies
For a scaling organization, Nexus offers three tangible assets:
1.  **Reduced Onboarding Time:** New hires read AI summaries instead of harassing senior engineers.
2.  **Higher Bus Factor:** No single employee holds the "keys to the kingdom" in their head; it's all in the system.
3.  **Audit-Ready History:** Investors and auditors can trace the full lineage of product development, from the first decision to the final exit report.

## 7. Final Positioning
Nexus is not just a project management tool; it is an **organizational insurance policy**. While other tools optimize for speed, Nexus optimizes for **continuity**, ensuring that your company's intellectual property survives the inevitable turnover of its workforce.

## 8. Key Technical Decisions (Why I Built It This Way)
I didn't just want to build another CRUD app; I wanted a system that feels *alive*. Here are a few intentional choices I made during development:

*   **SQLite + SQLAlchemy (The "Just Works" Stack):**
    I realized you don't need a complex PostgreSQL setup for a demo. SQLite is embedded, fast, and with SQLAlchemy as the ORM, we can switch to Postgres in production with a single config line. It kept the "time-to-hello-world" nearly instant.

*   **Optimistic Locking (Solving the "Lost Update" Problem):**
    Imagine two people editing a task at the same time—who wins? Instead of complex websockets, I implemented a versioning system. If the data changes while you're looking at it, the system politely tells you to refresh. It’s a simple, robust way to handle concurrency without over-engineering.

*   **Human-Readable AI Logs:**
    The "AI Reports" aren't just API dumps. I spent time tuning the prompts to sound *professional*. The feedback loop (Tasks -> Logs -> AI Summary) mimics how a real project manager thinks, turning raw data into an actual narrative.

*   **React + Vite + Tailwind (The modern standard):**
    I chose this frontend stack because it’s blazing fast and easy to maintain. The "Glassmorphism" UI wasn't just for looks—it limits visual noise so you focus on the data, not the borders.

*   **Strict State Machines:**
    You can't just drag a task to "Done". You *have* to log time. This isn't a UI restriction; it's a backend rule. I believe valid data is more important than easy data.
