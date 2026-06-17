# Domain and Cloudflare Setup

HelloTasks uses `hellotasks.online` managed through Cloudflare.

## DNS Records

Add these records in Cloudflare DNS after Render provides the deployment URL:

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` | `<your-render-service>.onrender.com` | Proxied (orange cloud) |
| CNAME | `www` | `hellotasks.online` | Proxied |

Check Render's **Custom Domains** panel for the exact CNAME target value.

## SSL / TLS

1. In Cloudflare → **SSL/TLS**, set mode to **Full (strict)**.
2. Render provides a valid TLS certificate automatically for custom domains.

## Redirect Rules

Enable **Always Use HTTPS** under SSL/TLS → Edge Certificates.

In Cloudflare → **Rules → Redirect Rules**, add:
- `www.hellotasks.online` → `https://hellotasks.online` (301 permanent)

## Cloudflare Turnstile

1. Go to Cloudflare Dashboard → **Turnstile**.
2. Click **Add Site**.
3. Name: `HelloTasks`, Domain: `hellotasks.online`, Widget Type: **Managed**.
4. Copy **Site Key** → `CLOUDFLARE_TURNSTILE_SITE_KEY` in Render env vars.
5. Copy **Secret Key** → `CLOUDFLARE_TURNSTILE_SECRET_KEY` in Render env vars.

## Security Settings (Recommended)

In Cloudflare → **Security**:

- Security Level: Medium
- Bot Fight Mode: On
- Challenge Passage: 30 minutes
