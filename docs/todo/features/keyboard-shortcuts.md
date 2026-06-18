# Feature: Keyboard Shortcuts

**Category:** Developer / Power User
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~2 hrs

## Description

A set of keyboard shortcuts for power users to navigate and perform common actions without reaching for the mouse. A shortcuts reference sheet opens with the `?` key. Shortcuts are disabled when a form input, textarea, or modal has focus.

## Proposed Shortcut Set

| Shortcut | Action |
|---|---|
| `?` | Show/hide shortcuts sheet |
| `/` | Focus global search input |
| `g d` | Go to Dashboard |
| `g p` | Go to Projects |
| `g t` | Go to Tasks (global list) |
| `g m` | Go to My Tasks |
| `g n` | Go to Notifications |
| `n` | New task (on project task list or kanban) |
| `k` | Go to Kanban board (on project page) |
| `Escape` | Close modal / clear search |

## Value

Keyboard shortcuts have an outsized impact on daily satisfaction for power users — developers and project leads who spend hours in the tool every day. Even a handful of well-chosen shortcuts (navigation + new task) dramatically reduce the friction of repetitive actions. They signal that the app is built for professionals, not just casual users.

## Technical Approach

### Model Changes

None.

### Routes

None.

### Controllers

None. Purely frontend.

### Views / JavaScript

Add to `public/js/main.js` (or a new `public/js/shortcuts.js`):

```js
const KEY_SEQUENCE_TIMEOUT = 800; // ms for multi-key sequences (g + d)
let keyBuffer = '';
let keyTimer;

document.addEventListener('keydown', (e) => {
  // Ignore when typing in inputs
  if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  if (document.activeElement.isContentEditable) return;

  const key = e.key.toLowerCase();

  // Single-key shortcuts
  if (key === '?') { toggleShortcutsSheet(); return; }
  if (key === '/') { e.preventDefault(); document.querySelector('.topbar-search')?.focus(); return; }
  if (key === 'escape') { closeActiveModal(); return; }

  // Sequence shortcuts (g + d, etc.)
  keyBuffer += key;
  clearTimeout(keyTimer);
  keyTimer = setTimeout(() => { keyBuffer = ''; }, KEY_SEQUENCE_TIMEOUT);

  const sequences = {
    'gd': '/dashboard',
    'gp': '/projects',
    'gt': '/tasks',
    'gm': '/my-tasks',
    'gn': '/notifications'
  };

  if (sequences[keyBuffer]) {
    window.location.href = sequences[keyBuffer];
    keyBuffer = '';
  }
});
```

Add a shortcuts sheet overlay:

```html
<div id="shortcuts-sheet" class="shortcuts-overlay" style="display:none;">
  <div class="shortcuts-modal">
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">
      <tr><td><kbd>?</kbd></td><td>Show shortcuts</td></tr>
      <tr><td><kbd>/</kbd></td><td>Focus search</td></tr>
      <!-- ... -->
    </table>
    <button onclick="toggleShortcutsSheet()">Close</button>
  </div>
</div>
```

## Files to Modify

- `public/js/main.js` or new `public/js/shortcuts.js` — shortcut event listener
- `views/layouts/main.ejs` — include shortcuts overlay HTML and script
- `public/css/components.css` — `.shortcuts-overlay`, `.shortcuts-modal`, `kbd` styles

## Dependencies

- Global Search feature (for the `/` shortcut to work, the search input must exist).

## Notes

- Shortcuts must be clearly disabled when focus is inside any input — this is the most common bug in shortcut implementations.
- The `?` sheet should be the first shortcut shipped — it is self-documenting and makes the feature discoverable.
- Multi-key sequences (`g d`) should use a short buffer window (~800ms). A longer window causes accidental navigation.
- Avoid shortcuts that conflict with browser defaults: `Ctrl+T`, `Ctrl+W`, `Ctrl+R`, `F5`, etc.
- Add a `data-shortcut` attribute to navigation links as a reference, so the shortcut handler stays in sync with route changes.
