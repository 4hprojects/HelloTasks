# Database Design

HelloTasks uses MongoDB (via Mongoose) for all app data, and Supabase Storage for files.

## MongoDB Collections

| Collection | Model file | Purpose |
|---|---|---|
| `users` | `models/User.js` | Accounts, roles, password hashes, invite/reset tokens |
| `projects` | `models/Project.js` | Projects with embedded `members[]` array |
| `tasks` | `models/Task.js` | Tasks with embedded checklist, statusHistory, qaReview, leadApproval |
| `comments` | `models/Comment.js` | Task comments |
| `filerecords` | `models/FileRecord.js` | Metadata for uploaded files (Supabase Storage references) |
| `notifications` | `models/Notification.js` | In-app notifications |
| `appsettings` | `models/AppSetting.js` | Single-document app config (appName, supportEmail, etc.) |
| `sessions` | (connect-mongo) | Express session store |

## Key Design Choices

**Project members are embedded** in `Project.members[]` as `{ user: ObjectId, role: String }`. This keeps project + membership reads as a single query.

**Task data is mostly embedded**: checklist items, status history entries, QA review, and lead approval are all embedded subdocuments. Comments and files are separate collections linked by `task` ObjectId.

**File metadata in MongoDB, files in Supabase**: `FileRecord` stores path, URL, MIME type, size, bucket, etc. The actual bytes live in Supabase Storage.

**AppSetting uses a fixed `_id: 'app'`** so there is always exactly one settings document. Use `AppSetting.findById('app')` to read, `AppSetting.findByIdAndUpdate('app', ..., { upsert: true })` to write.

## Supabase Storage

| Bucket | Content | Visibility |
|---|---|---|
| `attachments` | Task file uploads (images as WebP, documents) | Private (signed URLs) |

Files are uploaded from the server using the service role key. The `uploadService.js` handles multer → optional sharp WebP conversion → Supabase upload → returns URL + metadata.
