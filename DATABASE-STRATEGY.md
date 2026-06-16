# Database Strategy

## Core Rule

Hello ecosystem projects use MongoDB for authentication and main application data.

Supabase is used for storage and selected relational support.

## MongoDB

Use MongoDB for:

- User accounts
- Password hashes
- Authentication records
- Sessions
- App-specific roles
- Tickets
- Notes
- Logs
- Submissions
- Dynamic records
- Flexible documents

## Supabase

Use Supabase for:

- Storage buckets
- Image uploads
- WebP files
- File URLs
- Signed URLs
- Optional structured relational support
- Lookup tables where useful

## Auth Rule

Do not use Supabase Auth as the primary authentication system.

MongoDB auth is the Hello ecosystem standard.
