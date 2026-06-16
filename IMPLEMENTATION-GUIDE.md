# Implementation Guide

## Standard Stack

- Node.js
- Express
- EJS
- Vanilla JavaScript
- Custom CSS
- MongoDB
- Mongoose
- bcrypt
- express-session
- connect-mongo
- Supabase Storage
- Resend
- Render
- Cloudflare

## Folder Structure

```txt
project-name/
├── server.js
├── package.json
├── .env.example
├── config/
├── models/
├── routes/
├── controllers/
├── middleware/
├── services/
├── utils/
├── views/
├── public/
└── docs/
```

## Views

Use EJS.

Do not use React or Vue.

## CSS

Use custom CSS.

Do not use Tailwind or Bootstrap unless explicitly approved.

## JavaScript

Use vanilla JavaScript.

## Auth

Use MongoDB User model, bcrypt, express-session, and connect-mongo.

## Files

Use multer and sharp to convert images to WebP.

Upload final files to Supabase Storage.

Store file metadata in MongoDB.
