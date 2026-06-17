# Image Upload and WebP Workflow

## Flow

```
Browser → multipart form → multer (memory storage) → sharp (WebP if image) → Supabase Storage → FileRecord in MongoDB
```

1. User selects a file on the task show page and submits the upload form.
2. `routes/taskRoutes.js` applies `upload.single('file')` (multer middleware from `services/uploadService.js`).
3. The file lands in `req.file` as a buffer in memory (not written to disk).
4. `controllers/fileController.js` calls `uploadToSupabase(req.file, projectId, taskId)`.
5. Inside `services/uploadService.js`:
   - If the MIME type is `image/*`, `sharp` converts the buffer to WebP at 85% quality.
   - The (possibly converted) buffer is uploaded to the `attachments` bucket in Supabase Storage.
   - A unique filename is generated: `{projectId}/{taskId}/{timestamp}-{random}.{ext}`.
6. The public URL is returned.
7. `fileController` creates a `FileRecord` document in MongoDB linking the file to the task.
8. The task show page is redirected to and displays the new file.

## Image Settings

- Format: WebP
- Quality: 85%
- Max input size: 5 MB (enforced by multer `limits.fileSize`)
- Documents: not converted, stored as-is up to 10 MB

## Deleting Files

1. User clicks the trash icon on a file in the task show page.
2. `POST /projects/:projectId/tasks/:taskId/files/:fileId/delete` is called.
3. `fileController.deleteFile` checks that the user is the uploader or a manager.
4. The file is removed from Supabase Storage via the service role key.
5. The `FileRecord` document is deleted from MongoDB.
