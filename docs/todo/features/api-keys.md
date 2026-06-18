# Feature: API Keys

**Category:** User & Access Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can generate personal API keys for programmatic access to HelloTasks data. Each key has a label (e.g., "CI integration", "Zapier"), is shown only once at creation, and can be revoked at any time. API keys are used as Bearer tokens in the `Authorization` header: `Authorization: Bearer ht_...`.

API key authentication works alongside session authentication — any request with a valid API key is treated as the key's owner.

## Value

API keys are the foundation for all external integrations. CI pipelines need to post task updates, webhook receivers need to create tasks, external dashboards need to read project data. Without API keys, every integration must go through a user's session credentials — which is brittle and insecure. API keys provide a safe, revocable, scoped access mechanism.

## Technical Approach

### Model Changes

New model `models/ApiKey.js`:

```js
const ApiKeySchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label:     { type: String, required: true, trim: true },
  keyHash:   { type: String, required: true, unique: true },  // bcrypt hash of the raw key
  keyPrefix: { type: String, required: true },  // first 8 chars for display (e.g., 'ht_abc123')
  lastUsedAt:{ type: Date, default: null },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });
```

### Routes

```
GET    /account/api-keys           — list keys (never show raw key)
POST   /account/api-keys           — generate new key (show raw key once)
DELETE /account/api-keys/:id       — revoke key
```

### Controllers

- `generateApiKey`:
  - Generate raw key: `'ht_' + crypto.randomBytes(32).toString('hex')`
  - Hash with `bcrypt.hash(rawKey, 12)`
  - Save `ApiKey` with the hash and prefix
  - Return the raw key ONCE in the success flash (stored in session, rendered once, then cleared)

- Auth middleware update: check `req.headers.authorization` for `Bearer ht_...` tokens. If found, look up by prefix, verify hash, load user, attach to `req.user`. Bypass session auth if this succeeds.

### Views

- `views/account/api-keys.ejs`:
  - Table of existing keys: label, prefix, last used date, created date, revoke button
  - "Generate new key" form: label input + submit
  - Post-generation: one-time display of the raw key in a copyable input with a warning ("This is shown only once")

## Files to Modify

- `models/ApiKey.js` — new model
- `controllers/accountController.js` — add key generation and revocation handlers
- `middleware/authMiddleware.js` — add API key Bearer token check
- `routes/accountRoutes.js` — add API key routes
- `views/account/api-keys.ejs` — new view

## Dependencies

- REST API feature: API keys are most useful when a REST API exists. Build this alongside or just before the REST API.

## Notes

- Never store or return the raw key after creation — store only the bcrypt hash. The prefix (`ht_abc123`) is used to identify which key was used in logs without revealing the secret.
- API key requests should be rate-limited separately from session-based requests to prevent brute force.
- Keys inherit the owner's RBAC permissions — an API key for a Developer cannot perform admin actions.
- Consider key expiration (e.g., 1 year) as an optional future enhancement. For now, keys are permanent until revoked.
- `lastUsedAt` should be updated on every successful API key authentication (async, fire-and-forget update to avoid latency).
