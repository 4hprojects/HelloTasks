# Feature: CSV Import for Tasks

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Users can upload a CSV file to bulk-create tasks in a project. The CSV must follow a defined column format (title, description, priority, due date, assignee email, tags). After upload, the system validates the data, shows a preview of the rows to be imported, and creates the tasks on confirmation.

Errors (missing title, unrecognized assignee, bad date format) are shown per-row in the preview before any records are saved.

## Value

Teams migrating from another tool (Trello, Asana, a spreadsheet) face a high barrier if they must re-enter every task by hand. CSV import removes that barrier and makes HelloTasks viable as a migration target. It's also useful for creating large task batches from pre-defined templates in a spreadsheet.

## Technical Approach

### Model Changes

None. Tasks are created via the existing Task model.

### Routes

```
GET  /projects/:projectId/tasks/import        — import form
POST /projects/:projectId/tasks/import        — file upload + parse + preview
POST /projects/:projectId/tasks/import/confirm — save validated tasks
```

### Controllers

New `importController.js` (or add to `taskController.js`):

- `showImportForm`: render the upload page
- `previewImport`:
  - Receive CSV file via multer (memory storage, no Supabase needed)
  - Parse with `csv-parse` npm package
  - Validate each row: required fields, priority enum, date format, assignee email lookup
  - Store validated rows in `req.session.importPreview` (or a temporary MongoDB document)
  - Render preview table showing valid rows + error rows
- `confirmImport`:
  - Read validated rows from session/temp storage
  - Bulk insert via `Task.insertMany()`
  - Clear session import data
  - Redirect to task list with success flash

### Views

- New `views/tasks/import.ejs` — upload form with CSV template download link
- New `views/tasks/import-preview.ejs` — table showing parsed rows, errors highlighted in red, confirm/cancel buttons

## Files to Modify

- `controllers/importController.js` — new controller
- `routes/taskRoutes.js` — add import routes
- `views/tasks/import.ejs` — new view
- `views/tasks/import-preview.ejs` — new view
- `package.json` — add `csv-parse` dependency

## Dependencies

None specific to other features. `csv-parse` npm package required.

## Notes

- CSV column format to support: `title` (required), `description`, `priority` (low/medium/high/critical), `dueDate` (YYYY-MM-DD), `assigneeEmail`, `tags` (comma-separated within the cell).
- Provide a downloadable CSV template so users know the expected format.
- Do not silently skip error rows — show them clearly before confirming. Users may want to fix their CSV and re-upload.
- Limit to 500 rows per import to prevent abuse and timeout issues.
- Store the preview in session rather than a temp DB document for simplicity. Clear it after confirmation or on session end.
