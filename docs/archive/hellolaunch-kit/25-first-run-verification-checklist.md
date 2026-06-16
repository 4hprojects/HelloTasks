# First Run Verification

Use this after the starter app has been created and `.env` has been filled.

## 1. Install Dependencies

Run:

```bash
npm install
```

## 2. Start Development Server

Run:

```bash
npm run dev
```

## 3. Check Local URL

Open:

```txt
http://localhost:3000
```

or the port shown in your terminal.

## 4. Verify Base App

- [ ] Homepage loads
- [ ] CSS loads
- [ ] JavaScript loads
- [ ] Layout appears correctly
- [ ] No terminal errors

## 5. Verify MongoDB

- [ ] MongoDB connection success appears in terminal
- [ ] No authentication error
- [ ] No network access error
- [ ] Correct database name is used

## 6. Verify Register

- [ ] Open register page
- [ ] Submit valid user details
- [ ] User is created in MongoDB
- [ ] Password is hashed
- [ ] Plain password is not stored
- [ ] Duplicate email is blocked

## 7. Verify Login

- [ ] Open login page
- [ ] Submit correct email and password
- [ ] User is redirected to dashboard
- [ ] Current user appears in EJS
- [ ] Session is created

## 8. Verify Protected Routes

- [ ] Logout
- [ ] Try opening dashboard directly
- [ ] App redirects to login
- [ ] Login again
- [ ] Dashboard opens

## 9. Verify Logout

- [ ] Click logout
- [ ] Session is destroyed
- [ ] User is redirected to login
- [ ] Dashboard is no longer accessible without login

## 10. Common Issues

### MongoDB connection fails

Check:

```txt
MONGO_URI
Database username
Database password
Network access
Cluster status
```

### Session does not persist

Check:

```txt
SESSION_SECRET
connect-mongo setup
Cookie settings
APP_ENV
```

### CSS does not load

Check:

```txt
public folder setup
express.static
CSS file path
layout includes
```

### Supabase upload fails

Check:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
Bucket name
Bucket privacy
File size
File type
```

## Verification Result

```txt
First Run Status: Passed / Failed
Date:
Tester:
Issues Found:
Next Action:
```
