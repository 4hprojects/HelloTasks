# Feature: Print-friendly Task View

**Category:** Developer / Power User
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 hr

## Description

A `@media print` CSS stylesheet that produces a clean, readable printed or PDF-saved version of the task detail page. The print layout hides navigation, sidebar, topbar, action buttons, and interactive elements. It shows only the task title, metadata, description, checklist, comments, and status history in a clean, black-and-white format.

A "Print" button on the task detail page triggers `window.print()`.

## Value

Project stakeholders sometimes need to share or file task details outside the app — for client sign-off, for documentation archives, or for offline review. A print-friendly view allows this without copy-pasting content or taking screenshots. It is a small effort with occasional but real value.

## Technical Approach

### Model Changes

None.

### Routes

None. Purely CSS + a single JS call.

### Controllers

None.

### Views

- `views/tasks/show.ejs` — add a "Print" button in the task hero actions:
  ```html
  <button type="button" class="btn btn--ghost btn--sm" onclick="window.print()">Print</button>
  ```

### CSS

Add to `public/css/tasks.css` (or a new `public/css/print.css`):

```css
@media print {
  /* Hide non-content elements */
  .sidebar,
  .topbar,
  .btn,
  .form-actions,
  .task-show-hero-actions,
  .comment-form,
  .nav,
  .flash-messages,
  #sidebarToggle { display: none !important; }

  /* Reset layout to single column */
  body { font-size: 12pt; color: #000; background: #fff; }
  .main-content { margin: 0; padding: 0; }
  .task-show-hero { border-left: 3px solid #000; box-shadow: none; }

  /* Page breaks */
  .task-comments { page-break-before: always; }

  /* Show URLs for links */
  a[href]::after { content: ' (' attr(href) ')'; font-size: 9pt; color: #555; }

  /* Remove interactive styles */
  .badge { border: 1px solid #000; background: none; color: #000; }
}
```

## Files to Modify

- `public/css/tasks.css` (or new `public/css/print.css`) — `@media print` rules
- `views/tasks/show.ejs` — "Print" button
- `views/layouts/main.ejs` — include print CSS if in a separate file

## Dependencies

None. CSS-only implementation.

## Notes

- Test the print output in at least Chrome and Firefox — print rendering differs between browsers.
- Also apply print styles to the weekly report preview page (`views/admin/weekly-report-preview.ejs`) — this page is already designed as a summary and is likely to be printed.
- The `.sr-only` class (screen-reader-only content) should also be hidden in print.
- Avoid `!important` overuse — only use it where browser default print styles must be overridden.
- A future enhancement: a dedicated "Print view" route that renders a stripped-down version of the task without the full layout, for cleaner PDF generation.
