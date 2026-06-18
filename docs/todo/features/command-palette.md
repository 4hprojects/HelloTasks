# Feature: Command Palette

**Category:** Developer / Power User
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

A spotlight-style command palette opens with `Cmd+K` (or `Ctrl+K` on Windows/Linux). Users type to fuzzy-search actions, navigation destinations, and records. Results show immediately as the user types. Keyboard arrow keys navigate results; Enter executes the selected action.

Example commands:
- "New task" → open new task form
- "Go to Projects" → navigate to `/projects`
- "Switch to kanban" → navigate to current project's kanban
- "Jane Smith" → navigate to Jane's profile
- "Marketing project" → navigate to the Marketing project

## Value

A command palette is the fastest possible navigation for keyboard-oriented users. It collapses all navigation into a single interaction — open palette, type, enter. Tools like Linear, Vercel, and GitHub use it as the primary navigation mode for power users. For HelloTasks, it provides a feeling of speed and professionalism that a sidebar nav alone cannot match.

## Technical Approach

### Model Changes

None.

### Routes

```
GET /command-palette/search    — XHR fuzzy search across commands + records
```

### Controllers

- `commandSearch`:
  - Input: `req.query.q`
  - Static commands: list of `{ label, description, url }` objects defined in a `utils/commands.js` file
  - Dynamic records: short fuzzy search across Task titles, Project names (re-use the `suggest` query from Global Search)
  - Return merged JSON results, sorted by relevance

### Views / JavaScript

New `public/js/command-palette.js`:

```js
// Open on Ctrl+K / Cmd+K
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
  }
});

function openCommandPalette() {
  document.getElementById('cmd-palette').style.display = 'flex';
  document.getElementById('cmd-input').focus();
}

// Debounced input → fetch /command-palette/search?q=...
// Arrow keys → highlight result
// Enter → navigate to result URL or execute action
// Escape → close
```

HTML overlay in `views/layouts/main.ejs`:

```html
<div id="cmd-palette" class="cmd-overlay" style="display:none;" role="dialog" aria-label="Command palette" aria-modal="true">
  <div class="cmd-modal">
    <input type="text" id="cmd-input" class="cmd-input" placeholder="Type a command or search..." autocomplete="off" />
    <ul id="cmd-results" class="cmd-results" role="listbox"></ul>
  </div>
  <div class="cmd-backdrop" onclick="closeCommandPalette()"></div>
</div>
```

## Files to Modify

- `controllers/searchController.js` — add `commandSearch` handler (or extend existing search)
- `routes/searchRoutes.js` — add command search route
- `utils/commands.js` — new file: static command list
- `public/js/command-palette.js` — new file
- `views/layouts/main.ejs` — command palette overlay HTML + script include
- `public/css/components.css` — `.cmd-overlay`, `.cmd-modal`, `.cmd-input`, `.cmd-results` styles

## Dependencies

- Global Search feature provides the backend query logic — the command palette reuses it.
- Keyboard Shortcuts feature can be built alongside this.

## Notes

- The fuzzy matching should be client-side for static commands (instant, no network) and server-side for dynamic records (tasks, projects). Combine results in the JS layer.
- Use `aria-selected`, `role="option"`, and `aria-activedescendant` for proper keyboard accessibility.
- The backdrop click should close the palette. Escape also closes.
- Keep the initial result list short (8–10 items) — the user's most recently visited items could be shown before they type (stored in `localStorage`).
- The `Cmd+K` shortcut must not fire when focus is inside the command palette itself or in other inputs.
