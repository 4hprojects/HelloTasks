# Supabase Storage

HelloTasks uses Supabase Storage for file uploads. Supabase Auth is not used.

## Setup

1. Create a Supabase project at supabase.com.
2. Go to **Storage** → **Create Bucket**.
3. Name: `attachments`, set to **Private**.
4. Copy the **Project URL** → `SUPABASE_URL`
5. Copy the **service_role** key (Settings → API) → `SUPABASE_SERVICE_ROLE_KEY`
6. Add `SUPABASE_STORAGE_BUCKET=attachments` to `.env`.

## How Files Are Uploaded

`services/uploadService.js` handles the full pipeline:

1. `multer` receives the multipart form data in memory.
2. If the file is an image (JPEG, PNG, WebP), `sharp` converts it to WebP.
3. The file buffer is uploaded to Supabase Storage via the service role key.
4. The public or signed URL is returned along with file metadata.
5. `controllers/fileController.js` saves a `FileRecord` document to MongoDB.

## File Types Accepted

| Type | Max Size | Conversion |
|---|---|---|
| Images (JPG, JPEG, PNG, WebP) | 5 MB | Converted to WebP |
| PDF, DOC, DOCX | 10 MB | Stored as-is |
| XLS, XLSX, CSV | 10 MB | Stored as-is |
| PPT, PPTX | 10 MB | Stored as-is |
| TXT, MD | 10 MB | Stored as-is |

## File Visibility

The `attachments` bucket is private. Files are accessed via public path URLs (the bucket RLS controls access at the Supabase level). For stricter access control in a future version, signed URLs can be generated server-side.

## FileRecord Schema

Each uploaded file creates a `FileRecord` in MongoDB with:
- `originalName`, `storedName`, `mimeType`, `size`
- `storagePath` — path within the Supabase bucket
- `url` — public URL
- `uploadedBy` — User ObjectId
- `task`, `project` — linked task and project ObjectIds
- `isWebP` — whether the image was converted
