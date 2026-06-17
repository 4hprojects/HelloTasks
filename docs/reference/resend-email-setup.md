# Resend Email Setup

HelloTasks sends all transactional emails through Resend.

## Setup

1. Create an account at resend.com.
2. Go to **Domains** → **Add Domain** → enter `hellotasks.online`.
3. Add the DNS records Resend provides (SPF, DKIM, DMARC) in Cloudflare DNS.
4. Wait for domain verification (usually a few minutes).
5. Go to **API Keys** → **Create API Key**.
6. Copy the key → `RESEND_API_KEY` in `.env`.
7. Set `EMAIL_FROM=noreply@hellotasks.online` in `.env`.

## Emails Sent by HelloTasks

| Trigger | Recipient | Subject |
|---|---|---|
| Password reset requested | User | Reset your HelloTasks password |
| User invited (global invite) | Invitee | You've been invited to HelloTasks |
| User invited to project | Invitee | You've been invited to collaborate on [project] |
| Account activated by admin | User | Your HelloTasks account has been activated |
| Task assigned / reassigned | Assignee | You've been assigned to "[task]" |
| Task ready for review | QMs + managers | "[task]" is ready for review |
| Task returned for refinement | Assignee | "[task]" was returned for refinement |
| Task needs lead sign-off | Project leads | "[task]" needs your sign-off |
| Task completed | Assignee | "[task]" has been completed |
| Comment @mention | Mentioned user | [Author] mentioned you on "[task]" |
| Due date reminder (daily cron) | Assignee | Reminder: "[task]" is due tomorrow |
| Weekly report (manual trigger) | All super admins + project leads | Weekly Report |

## Email Service

`services/emailService.js` exports a single `sendEmail(to, subject, html)` function. All email sends go through this function.

The daily due date reminder runs via `node-cron` in `jobs/dueDateReminder.js`, started at server boot.
