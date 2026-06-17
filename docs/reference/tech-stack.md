# Tech Stack

## Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | ^4.18 | HTTP server and routing |
| EJS + express-ejs-layouts | ^3.1 / ^2.5 | Server-side templating |
| Mongoose | ^8.0 | MongoDB ODM |
| express-session + connect-mongo | ^1.17 / ^5.1 | Session management, MongoDB session store |
| bcryptjs | ^2.4 | Password hashing |
| multer | ^1.4 | Multipart file upload handling |
| sharp | ^0.33 | WebP image conversion |
| node-cron | ^4.3 | Daily due date reminder job |

## Frontend

- Vanilla JavaScript (no framework)
- Custom CSS (no Tailwind or Bootstrap)
- CSS custom properties (design tokens in `public/css/theme.css`)

## Services

| Service | Purpose |
|---|---|
| MongoDB Atlas | Primary database (auth, app data, sessions, logs) |
| Supabase Storage | File uploads (images as WebP, documents) |
| Resend | Transactional email |
| Render | Hosting (Node.js web service, auto-deploy from GitHub) |
| Cloudflare | DNS, SSL, CDN, Turnstile bot protection |

## What Is Not Used

- React, Vue, Angular, or any frontend framework
- TypeScript
- Supabase Auth (MongoDB custom auth is used instead)
- Tailwind or Bootstrap
- Redis or any cache layer
- WebSockets (post-MVP consideration)
