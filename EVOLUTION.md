# ContextFlow: System Evolution Strategy

This document outlines how the ContextFlow architecture is designed to evolve safely without breaking its core business invariants and knowledge preservation goals.

## 1. Extension without Contention
The system uses **Service-Layer Guardrails** and **Explicit State Machines**. New features should be added as separate modules that interact with these services rather than modifying the core models directly.

### Example: Adding a "Sprint" Module
- **Strategy**: Create a `Sprint` model that has a one-to-many relationship with `Task`.
- **Safety**: The `task_service.create_task` logic remains unchanged. The `Sprint` module simply "tags" tasks. No core invariants (like log requirement for DONE) are affected.

### Example: File Attachments
- **Strategy**: Link attachments to `WorkLog` or `Decision` IDs.
- **Safety**: Since logs and decisions are immutable (after 24h for decisions), the attachments gain a permanent "parent context" without requiring changes to the execution logic.

## 2. Decoupling AI from Domain Logic
The `AISummary` model and `ai_service` are decoupled from the core task execution.
- **Upgrading Models**: You can swap `gpt-4o` for `o1` or a local Llama model by updating ONLY `ai_service.get_client()`.
- **Prompt Engineering**: System prompts are isolated in `ai_service.py`, allowing for iterative refinement without affecting the database schema.
- **Schema Safety**: The `context_hash` ensures that if you change how data is stored, the AI will automatically detect "dirty context" and regenerate summaries.

## 3. Database Resilience
ContextFlow uses **Strict Schema Validation**:
- **Enums**: All statuses are backed by Python/SQL Enums, preventing "zombie states."
- **Check Constraints**: Business rules like `hours_spent > 0` are enforced at the database level, protecting against buggy frontend or API inputs.

## 4. Proactive Growth
The **Risk Detection Layer** is designed to grow.
- **Current**: Blocker frequency analysis.
- **Future**: Sentiment analysis on logs, velocity drop alerts, or stakeholder decision-impact mapping.
- **Non-Destructive**: These analyzers read data but never modify existing logs or decisions, adhering to the "Knowledge Provider" philosophy.
