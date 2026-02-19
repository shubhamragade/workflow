# Nexus: System Workflow

This document provides a step-by-step guide to the Nexus lifecycle, from project initiation to AI-enhanced knowledge preservation.

## 1. System Setup Phase
### Step 1: Admin Creates Project
- **Admin Inputs**: Project name, Description, Target completion date, Milestones (optional).
- **System Actions**:
    - Initializes project status = `ACTIVE`.
    - Starts tracking velocity baseline.

### Step 2: Admin Adds Team Members
- **Admin Inputs**: Assign roles (`Admin` / `Member`), Mark status.
- **System Actions**:
    - Enables members to create logs and work on tasks based on role.

## 2. Execution Phase (Daily Workflow)
### Step 3: Admin Creates Tasks
- **Task Fields**: Title, Description, Assigned member, Priority, Milestone.
- **Initial State**: `TODO`.

### Step 4: Member Starts Working
- **Action**: Member updates task state: `TODO` → `IN_PROGRESS`.
- **System Rule**: Validates against the **Task State Machine**.

### Step 5: Member Logs Daily Work
- **Action**: Member creates a **Work Log**.
- **System Invariants**:
    - `hours_spent > 0` (Schema Enforced).
    - Task must not be `DONE`.
- **Knowledge Captured**: Description, Blockers, Hours, Context.

### Step 6: Decision Created (If Needed)
- **Action**: Member creates a **Decision**.
- **System Safety**:
    - Immutable after 24 hours.
    - Logged in **System Event Log**.

## 3. Completion Phase
### Step 7: Task Marked DONE
- **Action**: Member marks task as `DONE`.
- **System Gatekeeper**:
    - **MUST** have ≥1 work log.
    - **MUST** be a valid transition (`IN_PROGRESS` → `DONE`).
- **Outcome**: Task is locked permanently; event recorded.

## 4. Automated Progress Engine
Every task state change triggers:
- **Project Completion %**: Calculated from DONE/Total ratio.
- **Velocity**: Tasks per week since project start.
- **Milestone Stats**: Hours aggregated per milestone.

## 5. AI Workflow (Read-Only Insights)
### Step 8: Daily Summary
- **Input**: Today's logs, updates, and decisions.
- **AI Action**: Generates work summary and key blockers.
- **Safety**: Marked as **Generated Summary**, versioned with context hash.

### Step 9: Weekly Summary
- **Input**: 7-day logs, completion changes, blocker frequency.
- **AI Action**: Generates velocity insights and risk signals.

### Step 10: Handover Workflow
- **Trigger**: Member marked `INACTIVE`.
- **System Action**: Fetches open tasks, decisions, and log history.
- **AI Action**: Generates structured handover report (Pending risks, next steps).
- **Outcome**: Knowledge preserved even if the contributor leaves.

## 6. Observability & Quality
- **System Event Log**: Audit trail of every state change.
- **Failure Handling**: AI failures are logged and tracked (`AISummary.status = FAILED`) without affecting core domain logic.
- **State Machines**: Strict terminal states (`DONE`, `COMPLETED`).

---
*Nexus: Turning Activity into Permanent Value.*
