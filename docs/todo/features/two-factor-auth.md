# Feature: Two-Factor Authentication (2FA)

**Category:** User & Access Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Users can enable two-factor authentication (2FA) on their account using a TOTP authenticator app (Google Authenticator, Authy, 1Password). After enabling 2FA, each login requires both a password and a 6-digit TOTP code from the authenticator app.

Super Admins can optionally enforce 2FA for all users with elevated roles (project lead, admin).

## Value

Passwords alone are insufficient security for a project management tool that may contain confidential business information. 2FA significantly reduces the risk of account compromise from stolen or phished passwords. It is especially important for Super Admin and Project Lead accounts that have broad access to all project data.

## Technical Approach

### Dependencies

- `speakeasy` npm package — TOTP secret generation and code verification
- `qrcode` npm package — generate QR code image for authenticator app enrollment

### Model Changes

Add to `models/User.js`:

```js
twoFactorEnabled: { type: Boolean, default: false },
twoFactorSecret:  { type: String, default: null },  // encrypted or hashed
twoFactor2FAEnrolledAt: { type: Date, default: null }
```

### Routes

```
GET  /account/2fa/setup    — show QR code and setup instructions
POST /account/2fa/enable   — verify first TOTP code and enable 2FA
POST /account/2fa/disable  — disable 2FA (requires current password + TOTP)
POST /auth/login/2fa       — second step: verify TOTP code after password success
```

### Controllers

- **Setup flow**:
  1. Generate `speakeasy.generateSecret({ name: 'HelloTasks:user@email.com' })`
  2. Store `secret.base32` temporarily in session (not yet saved to user)
  3. Generate QR code as a base64 data URL using `qrcode.toDataURL(secret.otpauth_url)`
  4. Render setup page with QR image and manual entry code
  5. User enters first TOTP code → verify → save secret to user model → set `twoFactorEnabled: true`

- **Login flow** (modify `postLogin`):
  1. Verify password as usual
  2. If `user.twoFactorEnabled`, do NOT set session yet — instead set `req.session.pendingUserId = user._id` and redirect to `/auth/login/2fa`
  3. On 2FA page, user enters TOTP code → `speakeasy.totp.verify(...)` → if valid, set `req.session.userId` and proceed

### Views

- `views/account/2fa-setup.ejs` — QR code display, manual code entry, verification input
- `views/auth/login-2fa.ejs` — 6-digit TOTP input form
- Account settings page — 2FA status toggle (enable/disable)

## Files to Modify

- `models/User.js` — add 2FA fields
- `controllers/authController.js` — update login flow for 2FA check
- `controllers/accountController.js` — new 2FA setup/disable handlers
- `routes/authRoutes.js` — add 2FA login route
- `routes/accountRoutes.js` — add 2FA setup/disable routes
- `views/auth/login-2fa.ejs` — new view
- `views/account/2fa-setup.ejs` — new view
- `package.json` — add `speakeasy`, `qrcode`

## Dependencies

None beyond the new npm packages.

## Notes

- Store the TOTP secret encrypted at rest (use Node's `crypto` module with an `APP_SECRET` env var as the encryption key). Do not store it as plaintext.
- Generate backup codes (8 single-use codes) when 2FA is first enabled. These allow account recovery if the user loses their authenticator app. Store as bcrypt hashes.
- The session `pendingUserId` set during the 2FA step should expire quickly (5 minutes) to prevent session fixation.
- Rate-limit the 2FA code submission endpoint — 5 failed attempts should temporarily lock the 2FA step (not the full account).
