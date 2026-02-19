# AI Guidance: Project Activity Journal

This file defines the constraints and safety principles for AI integration within the Project Activity Journal system.

## Reliability & Accuracy
- **No Hallucination**: AI must not invent project data, names, or metrics. It must only summarize existing logs and decisions.
- **Source Grounding**: AI only reads structured data from the database (WorkLogs, Decisions, Tasks).
- **Handover Reports**: Triggered upon member exit. Must highlight pending tasks, transition risks, and major historical contributions without bias.
- **Evolution Metrics**: Daily/Weekly summaries must reflect system-calculated metrics (completion %, velocity) and never invent progress stats.

## Safety & Permissions
- **Read-Only Access**: AI logic is strictly for generation/summarization. It cannot modify system state, change task statuses, or delete records.
- **Derived Marking**: All AI output must be capped with the [DERIVED] tag and the specific report type (e.g., HANDOVER_PROTOCOL).
- **Context Preservation**: AI must preserve the technical context of decisions and blockers without oversimplification.

## Development & Maintenance
- **Testing**: Any changes to AI prompts or summarization logic require corresponding tests to ensure consistency.
- **Auditability**: AI summaries should ideally link back to the source logs where appropriate.
