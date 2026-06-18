# Feature: CSV / PDF Export

**Category:** Reporting & Analytics
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day (CSV) / ~1 day (PDF)

## Description

Users can download a task list or report as a CSV file for use in spreadsheets, or as a PDF for sharing or printing. Export is triggered from the task list filter bar and report pages.

**CSV export**: downloads the current filtered task list as a spreadsheet-compatible `.csv` file. Columns: title, status, priority, assignee, project, due date, tags, created at.

**PDF export**: generates a formatted PDF of a report (weekly summary, task completion, at-risk). More complex but produces a professional shareable document.

## Value

Stakeholders outside the app (clients, executives, external teams) need data in formats they can open without logging in. CSV is the universal interchange format — anyone can open it in Excel or Google Sheets. PDF reports can be emailed or attached to documents. Both are basic expectations for any professional project management tool.

## Technical Approach

### Model Changes

None.

### Routes

```
GET /projects/:projectId/tasks/export.csv    — download task list as CSV
GET /reports/weekly/export.csv               — export weekly report data as CSV
GET /reports/weekly/export.pdf               — export weekly report as PDF (optional)
```

### Controllers

**CSV export** (simple, no npm package required):

```js
async function exportTasksCsv(req, res) {
  const tasks = await Task.find({ project: projectId, ...filters }).populate('assignee project').lean();
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.assignee ? t.assignee.fullName : '',
    t.project ? t.project.name : '',
    t.dueDate ? t.dueDate.toISOString().slice(0, 10) : '',
    (t.tags || []).join('; ')
  ].join(','));

  const csv = ['Title,Status,Priority,Assignee,Project,Due Date,Tags', ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
  res.send(csv);
}
```

**PDF export** (requires `pdfkit` npm package):

```js
const PDFDocument = require('pdfkit');

async function exportReportPdf(req, res) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="weekly-report.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text('HelloTasks — Weekly Report', { align: 'center' });
  // ... add content
  doc.end();
}
```

### Views

- `views/tasks/list.ejs` — add "Export CSV" button in the filter bar
- `views/reports/*.ejs` — add "Export CSV" / "Export PDF" buttons on report pages

## Files to Modify

- `controllers/taskController.js` — add `exportTasksCsv`
- `controllers/reportController.js` — add `exportReportPdf` / `exportReportCsv`
- `routes/taskRoutes.js` — add CSV export route
- `routes/reportRoutes.js` — add PDF/CSV export routes
- `views/tasks/list.ejs` — export button
- `views/reports/*.ejs` — export buttons
- `package.json` — add `pdfkit` if PDF is included

## Dependencies

- CSV export: no dependencies.
- PDF export: `pdfkit` npm package.

## Notes

- CSV export is 2–3 hours of work. Do it first.
- PDF export with good formatting (tables, headers, branding) takes longer. Consider delivering CSV first and PDF as a follow-up.
- Respect the same RBAC rules as the page that triggers the export — do not allow exporting data the user cannot see in the UI.
- For large task sets (1000+ rows), stream the CSV response rather than buffering in memory.
