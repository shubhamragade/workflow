# ContextFlow: AI-Driven Project Management & Knowledge Retention System

## 1. The Real-World Problem: Silent Knowledge Loss & Accountability Gaps
In fast-growing companies, projects often suffer from "silent failure." Status updates are vague ("working on it"), critical decisions are made in fleeting Slack chats, and when a key employee leaves, they take 80% of the project context with them. The result is a cycle of re-work, lost intellectual property, and projects that drift without clear accountability.

## 2. Why Existing Tools Fail
Traditional tools like Jira or Asana excel at tracking *what* needs to be done, but fail to capture *why* and *how*.
-   **No Context:** A "Done" ticket tells you nothing about the trade-offs made during implementation.
-   **No Gatekeeping:** Tasks can be marked complete without documentation, leading to technical debt.
-   **Manual Reporting:** Managers spend hours chasing team members for updates that are often outdated by the time they are read.
-   **Violent Exits:** When an employee leaves, their tasks are often orphaned, and their unwritten knowledge is lost forever.

## 3. How ContextFlow Manages the Complete Project Lifecycle
This system enforces a structured, high-integrity workflow from inception to delivery:
-   **Creation:** Managers define Projects and assign Tasks with clear priorities.
-   **Execution (The "Work Log" Gate):** Unlike standard tools, **users cannot mark a task as DONE without logging work.** This simple friction point ensures every completed unit of value has associated documentation.
-   **Review:** A dedicated "Review" workflow state (`TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`) ensures quality control before a task is closed.
-   **Immutability:** Once a Decision is recorded (e.g., "We chose PostgreSQL over Mongo"), it becomes immutable. This prevents "historical revisionism" and clearly documents the architectural path.

## 4. Preserving Long-Term Project Memory
ContextFlow treats **Project Memory** as a first-class citizen, not a byproduct.
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
For a scaling organization, ContextFlow offers three tangible assets:
1.  **Reduced Onboarding Time:** New hires read AI summaries instead of harassing senior engineers.
2.  **Higher Bus Factor:** No single employee holds the "keys to the kingdom" in their head; it's all in the system.
3.  **Audit-Ready History:** Investors and auditors can trace the full lineage of product development, from the first decision to the final exit report.

## 7. Final Positioning
ContextFlow is not just a project management tool; it is an **organizational insurance policy**. While other tools optimize for speed, ContextFlow optimizes for **continuity**, ensuring that your company's intellectual property survives the inevitable turnover of its workforce.
