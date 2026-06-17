# Open Questions and Decisions

All questions resolved as of 2026-06-16. See `DECISIONS.md` for the full log.

## Resolved

| Question | Decision |
|---|---|
| Who can register? | Open registration. Super Admin activates accounts. |
| Can developers create tasks? | Yes. |
| Who approves task completion? | QM by default. Project Lead sign-off only when the task flag is set. |
| How are confidential tasks shown? | Masked locked cards on the Kanban board. |
| Delete vs archive? | Both available. Both require a confirmation dialog. |
| Weekly reports format? | Manual HTML email triggered from admin panel. No PDF for MVP. |
| Public pages? | Excluded from MVP. Internal workflow ships first. |
| External URLs on tasks? | Stored as links. Server-side http/https format validation only. |
| Blocked vs Confidential? | Blocked = task status. Confidential = visibility flag. Separate concerns. |
| First Super Admin? | Created via `npm run seed` using env vars. |
| Kanban columns? | 7: Draft, Assigned, In Progress, Review, Approved, Done, Blocked. |

## Post-MVP Backlog

These are explicitly excluded from MVP scope and tracked for future consideration:

- Automated scheduled weekly email reports
- Advanced analytics and charts
- Real-time updates (WebSockets)
- Public marketing pages
- AI task generation
- AI report generation
- Mobile app
- Multi-tenant billing
- Supabase relational tables (lightweight analytics, lookup tables)
