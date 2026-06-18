# Feature: Dark Mode

**Category:** Developer / Power User
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~2 hrs

## Description

A toggle in user account settings (and optionally in the topbar) switches between light and dark themes. The preference is saved to the user's account and persists across sessions. The default follows the user's OS preference (`prefers-color-scheme`).

## Value

Dark mode reduces eye strain in low-light environments and is a broadly expected feature in modern web apps. For developers who spend long hours in the tool, it is a quality-of-life improvement that directly affects daily comfort. It also demonstrates attention to user experience beyond functional requirements.

## Technical Approach

### Model Changes

Add to `models/User.js`:

```js
theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
```

### Routes

```
POST /account/theme    — save theme preference (XHR, returns JSON)
```

### Controllers

- `updateTheme`: save `req.body.theme` to `req.user.theme`
- In the current user middleware (`middleware/currentUser.js`): pass `user.theme` to `res.locals.theme` so it is available in all views

### Views

**CSS approach**: All theme-aware colour values already use CSS custom properties (`var(--color-surface)`, `var(--color-text)`, etc.). Add a dark theme override block in `public/css/theme.css`:

```css
[data-theme="dark"] {
  --color-bg:          #0f172a;
  --color-surface:     #1e293b;
  --color-border:      #334155;
  --color-text:        #f1f5f9;
  --color-text-muted:  #94a3b8;
  --color-primary:     #3b82f6;
  --color-accent:      #22c55e;
  /* ... override all variables */
}
```

**HTML**: In `views/layouts/main.ejs`, set `data-theme` on `<html>`:

```ejs
<html data-theme="<%= theme === 'dark' ? 'dark' : (theme === 'system' ? '' : 'light') %>">
```

For `system` mode, add a small inline script before the CSS loads:

```html
<script>
  if (document.documentElement.dataset.theme === '') {
    document.documentElement.dataset.theme =
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
</script>
```

**Toggle**: Add a theme toggle button in the topbar or user dropdown (sun/moon icon). Clicking fires an XHR POST to `/account/theme` and toggles `data-theme` on `<html>` immediately (no page reload).

## Files to Modify

- `models/User.js` — add `theme` field
- `middleware/currentUser.js` — pass `theme` to `res.locals`
- `controllers/accountController.js` — add `updateTheme` handler
- `routes/accountRoutes.js` — add theme route
- `views/layouts/main.ejs` — add `data-theme` attribute + inline script
- `views/partials/topbar.ejs` — add theme toggle button
- `public/css/theme.css` — dark mode CSS variable overrides

## Dependencies

None. All colours must already use CSS custom properties — verify this is consistently true in `base.css` and `components.css` before starting.

## Notes

- Do a CSS audit first: any hardcoded colour values (`#fff`, `color: black`) that bypass CSS variables will not respond to the theme switch. Fix those before building dark mode.
- The `system` default is the best user experience — it respects what the user's OS already knows about their preference, with no setup required.
- Test dark mode in all views, especially: kanban board, task show (timeline dots), form inputs, badges, and modal overlays — these areas commonly have hardcoded colours.
- Save theme preference as soon as the toggle is clicked (XHR). Do not require a separate "Save settings" form submit.
