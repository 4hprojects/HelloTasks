# HelloTasks QR Creator
## Codex Implementation Project File

## Project Name

HelloTasks QR Creator

## Target URL

```text
https://hellotasks.online/qr
```

## Project Context

HelloTasks is an existing web application using:

- Node.js
- Express
- EJS
- Plain CSS
- Vanilla JavaScript
- Supabase as the primary database when persistent storage is required
- Existing HelloTasks authentication, middleware, layout, and deployment structure

The QR Creator must be added as a modular feature inside the existing HelloTasks repository.

The first implementation is a public static QR generator that does not require login and does not require database storage.

Future phases may use Supabase for saved QR projects, dynamic QR links, scan analytics, and logo storage.

---

# 1. Purpose

Create a reliable, mobile-friendly QR code generator inside HelloTasks.

A user must be able to:

1. Open `/qr`.
2. Select a QR type.
3. Enter valid information.
4. Customize the QR appearance.
5. Preview the QR code.
6. Download it as PNG or SVG.
7. Use the tool without logging in.
8. Generate the QR code without storing the entered content.

The implementation must prioritize:

- QR scan reliability
- Privacy
- Mobile responsiveness
- Maintainability
- Compatibility with the existing HelloTasks codebase
- Clear separation from unrelated task-management features

---

# 2. Implementation Scope

Implement only the Phase 1 static QR Creator.

## Included

- Public `/qr` page
- Public `/qr/help` page
- QR type selection
- Content forms
- Input validation
- Payload generation
- Live QR preview
- Foreground color
- Background color
- QR size
- Margin or quiet zone
- Error correction level
- Dot style
- Corner style
- Optional center logo
- Logo size control
- PNG download
- SVG download
- Reset function
- Encoded payload viewer
- Mobile-responsive layout
- Accessibility support
- Automated tests
- Developer documentation

## Excluded

Do not implement:

- Saved QR projects
- QR-specific user accounts
- Dynamic QR codes
- Redirect tracking
- Scan analytics
- QR expiration
- Password-protected destinations
- CSV bulk generation
- QR API
- Subscription plans
- Payment processing
- Team QR libraries
- Database tables
- Supabase migrations
- Supabase Storage integration
- Authentication changes
- Task or project schema changes

---

# 3. Database Rule

Supabase is the primary database for HelloTasks whenever persistent storage is required.

Phase 1 must not require persistent storage.

Do not introduce:

- MongoDB
- Mongoose
- SQLite
- Local JSON database files
- Browser persistence for sensitive payloads
- A new database provider

Future storage work must use:

- Supabase PostgreSQL
- Supabase Auth or the existing HelloTasks authentication integration
- Supabase Storage when file persistence becomes necessary
- Row Level Security
- Repository-managed SQL migrations

No Supabase service-role key may be exposed to client-side JavaScript.

---

# 4. Technology Boundaries

Use the current HelloTasks stack.

## Required

- Node.js
- Express
- EJS
- Plain CSS
- Vanilla JavaScript
- Existing HelloTasks middleware
- Existing HelloTasks layout and partials
- Existing test framework when available

## Do Not Introduce

- React
- Vue
- Angular
- Svelte
- Tailwind CSS
- TypeScript
- A new bundler unless the repository already uses one
- A new CSS framework
- A separate microservice
- A second deployment
- A new authentication system

Use a locally installed QR library. Do not rely on a public production CDN.

Recommended library:

```text
qr-code-styling
```

Optional support library:

```text
qrcode
```

Use `qrcode` only when needed for testing or server-side utility support.

Do not install `sharp` unless logo processing cannot be handled safely in the browser and the repository architecture clearly supports server-side image processing.

---

# 5. Repository Inspection Requirements

Before changing code, inspect the repository.

Identify:

- Main application entry point
- Route registration pattern
- Controller structure
- EJS layout system
- Shared header and footer
- Navigation partial
- Public asset folders
- Existing CSS variables
- Existing form controls
- Existing card components
- Existing button styles
- Authentication middleware
- Public-route conventions
- Error-handling middleware
- Content Security Policy
- Test framework
- Linting commands
- Formatting commands
- PM2 configuration
- Environment variable conventions
- Current package manager
- Existing module naming conventions

Do not assume file paths from this document are exact.

Adapt the implementation to the current repository structure.

Before implementation, produce a short internal repository assessment containing:

- Files to create
- Files to modify
- Dependencies to add
- Risks
- Test strategy

Do not modify unrelated files.

---

# 6. Proposed Module Structure

Use the closest structure supported by the repository.

Suggested structure:

```text
routes/
└── qrRoutes.js

controllers/
└── qrController.js

services/
└── qrPayloadService.js

validators/
└── qrValidators.js

utils/
└── qrFilename.js

views/
└── qr/
    ├── index.ejs
    ├── help.ejs
    └── partials/
        ├── qr-type-selector.ejs
        ├── qr-form-url.ejs
        ├── qr-form-text.ejs
        ├── qr-form-email.ejs
        ├── qr-form-phone.ejs
        ├── qr-form-sms.ejs
        ├── qr-form-wifi.ejs
        ├── qr-form-vcard.ejs
        ├── qr-form-location.ejs
        ├── qr-form-event.ejs
        ├── qr-customization.ejs
        └── qr-preview.ejs

public/
└── qr/
    ├── css/
    │   └── qr-creator.css
    ├── js/
    │   ├── qr-creator.js
    │   ├── qr-payload-builder.js
    │   ├── qr-validation.js
    │   └── qr-download.js
    └── images/
        └── qr-placeholder.svg

tests/
├── qrPayloadService.test.js
├── qrValidators.test.js
└── qrRoutes.test.js
```

Combine files when the repository favors fewer modules.

Keep the feature isolated from unrelated task logic.

---

# 7. Routes

Implement:

```text
GET /qr
GET /qr/help
```

## `/qr`

Requirements:

- Public route
- No login required
- Renders the QR Creator
- Uses existing HelloTasks layout
- Includes QR CSS and JavaScript
- Does not load task dashboard data
- Does not write to the database

## `/qr/help`

Requirements:

- Public route
- Explains supported QR types
- Explains PNG and SVG
- Explains QR contrast
- Explains logo limitations
- Explains testing before printing
- Explains that static QR content cannot be changed after printing
- States that QR content is not stored only when implementation is fully client-side

Do not add future routes during Phase 1.

Reserved future routes:

```text
GET /qr/saved
GET /qr/new
POST /qr
GET /qr/:id
GET /qr/:id/edit
POST /qr/:id
POST /qr/:id/delete
GET /q/:shortCode
```

---

# 8. Supported QR Types

Implement the following QR types.

## 8.1 Website URL

Fields:

- URL
- Optional label for filename generation

Rules:

- Accept `http:` and `https:`
- Normalize a domain without a scheme to `https://`
- Reject unsafe schemes

Blocked schemes:

```text
javascript:
data:
file:
vbscript:
```

Example payload:

```text
https://hellotasks.online
```

---

## 8.2 Plain Text

Fields:

- Text
- Optional title for filename generation

Maximum:

```text
1500 characters
```

Example:

```text
Submit your activity before Friday at 5:00 PM.
```

---

## 8.3 Email

Fields:

- Recipient email
- Subject
- Message

Payload format:

```text
mailto:email@example.com?subject=Subject&body=Message
```

Limits:

```text
Subject: 150 characters
Message: 2000 characters
```

Encode query parameters correctly.

---

## 8.4 Phone

Fields:

- Phone number

Payload format:

```text
tel:+639XXXXXXXXX
```

Allow:

- Digits
- Plus sign
- Spaces
- Parentheses
- Hyphens

Do not force Philippine formatting.

---

## 8.5 SMS

Fields:

- Phone number
- Message

Payload format:

```text
sms:+639XXXXXXXXX?body=Message
```

Maximum message length:

```text
500 characters
```

---

## 8.6 Wi-Fi

Fields:

- Network name
- Password
- Security type
- Hidden network toggle

Security options:

- WPA
- WPA2
- WEP
- None

Payload format:

```text
WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
```

Rules:

- Network name is required.
- Password is required for WPA, WPA2, and WEP.
- Password is optional for None.
- Escape Wi-Fi special characters correctly.

Special characters requiring attention:

```text
\
;
,
:
"
```

Maximums:

```text
SSID: 64 characters
Password: 128 characters
```

Never log Wi-Fi passwords.

---

## 8.7 Contact Card

Use vCard.

Fields:

- First name
- Last name
- Organization
- Position
- Phone number
- Email
- Website
- Address

Rules:

- First name or organization is required.
- Validate optional email and URL values.
- Escape vCard values correctly.

---

## 8.8 Geographic Location

Fields:

- Latitude
- Longitude

Payload format:

```text
geo:16.4164,120.5931
```

Validation:

```text
Latitude: -90 to 90
Longitude: -180 to 180
```

---

## 8.9 Calendar Event

Fields:

- Event title
- Description
- Location
- Start date and time
- End date and time

Rules:

- Event title is required.
- Start is required.
- End is required.
- End must be later than start.
- Use the browser timezone.
- Build a valid calendar payload.
- Keep date conversion logic explicit and testable.

Maximums:

```text
Description: 1000 characters
Location: 500 characters
```

---

# 9. Payload Builder

Create reusable payload-building logic.

Recommended functions:

```javascript
buildUrlPayload(data)
buildTextPayload(data)
buildEmailPayload(data)
buildPhonePayload(data)
buildSmsPayload(data)
buildWifiPayload(data)
buildVCardPayload(data)
buildLocationPayload(data)
buildCalendarPayload(data)
buildQrPayload(type, data)
```

Each builder must:

- Trim input
- Validate required values
- Escape special characters
- Encode query parameters
- Apply length limits
- Return a consistent result
- Avoid mutating the source object

Suggested success result:

```javascript
{
  success: true,
  payload: "generated payload",
  errors: []
}
```

Suggested failure result:

```javascript
{
  success: false,
  payload: null,
  errors: [
    {
      field: "fieldName",
      message: "Clear user-facing message."
    }
  ]
}
```

Do not include sensitive values in thrown errors or logs.

---

# 10. Validation

Use HTML validation and JavaScript validation.

Do not rely on HTML validation alone.

Validation requirements:

- Field-specific messages
- Clear invalid state
- `aria-describedby` links
- Error summary when multiple fields fail
- No QR generation while invalid
- No download while invalid
- Validation must run again before download

Example messages:

```text
Enter a valid website address.
Enter a valid email address.
Network name is required.
Enter a latitude between -90 and 90.
End time must be later than start time.
```

Avoid technical messages.

---

# 11. Frontend State

Use a centralized JavaScript state object.

Suggested structure:

```javascript
const qrState = {
  type: "url",
  formData: {},
  design: {
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    size: 800,
    margin: 4,
    errorCorrectionLevel: "H",
    dotStyle: "square",
    cornerStyle: "square",
    logoSize: 0.2
  },
  logo: null,
  payload: "",
  isValid: false
};
```

State operations:

- Set QR type
- Update form field
- Update design option
- Upload logo
- Remove logo
- Validate
- Build payload
- Render QR
- Download PNG
- Download SVG
- Reset

Avoid scattering state across many unrelated DOM attributes.

---

# 12. Live Generation

Use live updates with debounce.

Recommended delay:

```text
300 to 500 milliseconds
```

Flow:

```text
Input changes
→ Debounce
→ Validate
→ Build payload
→ Render preview
```

Keep a Generate button as a fallback.

The Generate button must run the same validation and rendering logic.

Do not render when:

- Required fields are missing
- URL is unsafe
- Coordinates are invalid
- Event times are invalid
- Logo is invalid
- Payload is too large
- QR library fails

---

# 13. QR Customization

Implement:

- Foreground color
- Background color
- QR size
- Margin
- Error correction level
- Dot style
- Corner style
- Optional logo
- Logo size control

Defaults:

```text
Foreground: #000000
Background: #FFFFFF
Size: 800
Margin: 4
Error correction: H
Dot style: square
Corner style: square
```

Allowed size options may include:

```text
300
500
800
1200
```

Do not allow a zero quiet zone.

Use high error correction automatically when a logo is added.

Place advanced controls in a collapsible section when this improves usability.

---

# 14. Logo Upload

Supported formats:

- PNG
- JPEG
- WebP

Do not accept SVG in Phase 1.

Limits:

```text
Maximum file size: 2 MB
Maximum dimensions: 2000 × 2000
```

Requirements:

- Validate extension
- Validate MIME type
- Decode before use
- Reject malformed images
- Show preview
- Allow removal
- Use browser memory only
- Revoke object URLs
- Do not upload to the server
- Do not store in Supabase
- Do not store in localStorage
- Do not log filenames when they may contain personal data

Warn when the logo is too large for reliable scanning.

---

# 15. QR Reliability Safeguards

The design must protect scan reliability.

Implement:

- Required quiet zone
- Contrast calculation or practical contrast check
- Low-contrast warning
- Logo size limit
- High error correction with logo
- Restrained dot-style choices
- Restrained corner-style choices
- Warning when content density is high
- Test-before-printing guidance

Example warnings:

```text
The foreground and background colors may be too similar for reliable scanning.
```

```text
Large logos may make the QR code harder to scan.
```

Do not block all custom colors, but block combinations that make the code effectively unreadable.

---

# 16. Preview Panel

The preview must:

- Show an empty state before valid generation
- Update after content changes
- Update after design changes
- Display user-friendly generation errors
- Scale without distortion
- Preserve the quiet zone
- Remain visible on desktop when practical
- Appear below the form on mobile
- Use `aria-live` for status changes

Empty-state text:

```text
Your QR code preview will appear here.
```

The preview panel may be sticky on large screens.

---

# 17. Download

Implement:

- PNG
- SVG

PNG requirements:

- Use selected dimensions
- Preserve background
- Preserve quiet zone
- Use the latest valid state

SVG requirements:

- Preserve vector quality
- Include logo only when safely supported
- Produce a valid downloadable file
- Scan correctly after export

Before download:

1. Revalidate.
2. Rebuild the payload.
3. Regenerate using current settings.
4. Confirm the QR exists.
5. Show a user-facing error on failure.

Filename rules:

- Lowercase
- Replace spaces with hyphens
- Remove unsupported characters
- Avoid empty filenames
- Add the correct extension

Example:

```text
hellotasks-qr-project-board.png
```

Fallback:

```text
hellotasks-qr.png
```

---

# 18. Reset Behavior

Add a Reset button.

Reset must:

- Return to the default QR type
- Clear form values
- Restore design defaults
- Remove logo
- Revoke logo object URL
- Clear payload
- Clear preview
- Clear validation errors
- Reset button states

Ask for confirmation only when the user has entered or changed data.

---

# 19. Encoded Payload Viewer

Add a collapsed section:

```text
View encoded content
```

Requirements:

- Show the current payload
- Include a Copy button
- Do not expose the payload before it is valid
- Do not send the payload to the server
- Make Wi-Fi password visibility clear before copying
- Do not automatically expand the section

---

# 20. User Interface

## Desktop

Use a two-column layout.

Recommended proportions:

```text
Form: 55%
Preview: 45%
```

Structure:

```text
Page title
Short description
QR type selector
Content form
Customization
Generate and Reset
Preview
Download buttons
Encoded content
Help link
```

## Mobile

Use this order:

```text
Page title
QR type selector
Content form
Customization
Generate and Reset
Preview
Download buttons
Encoded content
Help
```

Requirements:

- Full-width controls when useful
- Touch-friendly buttons
- No horizontal scrolling
- Preview fits narrow screens
- Long payloads wrap safely
- Color fields include hex text inputs

---

# 21. Accessibility

Implement:

- Semantic headings
- Proper labels
- Keyboard navigation
- Visible focus styles
- Sufficient color contrast
- Error linking
- `aria-live` status
- Accessible accordions
- Text labels for icon buttons
- Alt text for logo preview
- Button states
- Disabled-state clarity

Do not use color alone to communicate errors or warnings.

---

# 22. Branding

Follow the existing HelloTasks design.

Reuse:

- Header
- Footer
- Navigation
- Typography
- CSS variables
- Button styles
- Card styles
- Form styles
- Spacing scale

Do not create a visually unrelated product.

Navigation label:

```text
QR Creator
```

Add the navigation link only where appropriate for public users and authenticated users.

Do not make the QR module the default landing page.

---

# 23. Privacy

Phase 1 must remain client-side where practical.

Do not store:

- URLs
- Plain text
- Email addresses
- Phone numbers
- SMS content
- Wi-Fi names
- Wi-Fi passwords
- Contact information
- Coordinates
- Event details
- QR payloads
- Uploaded logos

Do not send form values to analytics or logs.

Use this statement only when true:

```text
Your QR code is generated in your browser and is not saved by HelloTasks.
```

Do not make this claim when any content is sent to the server.

---

# 24. Security

Requirements:

- Reject unsafe URL schemes
- Do not automatically open generated links
- Use local dependency assets
- Keep CSP changes minimal
- Validate image files
- Avoid innerHTML for user content
- Escape content rendered into the page
- Preserve existing CSRF protections
- Preserve existing security headers
- Preserve existing rate limiting
- Avoid logging sensitive payloads
- Do not expose Supabase credentials
- Do not add server-side upload endpoints

Review the current CSP before adding scripts.

Prefer bundled or locally served browser scripts.

---

# 25. Error Handling

Handle:

- Missing fields
- Invalid URL
- Invalid email
- Invalid phone
- Invalid SMS
- Invalid Wi-Fi configuration
- Invalid coordinates
- Invalid calendar range
- Invalid logo
- Unsupported browser download
- QR library failure
- Excessive payload
- Invalid color setting
- Missing dependency asset

User errors must be clear and non-technical.

Technical errors may be logged without payload content.

---

# 26. Testing

Use the existing test framework.

## Unit Tests

Test:

- URL builder
- Text builder
- Email builder
- Phone builder
- SMS builder
- Wi-Fi builder
- vCard builder
- Location builder
- Calendar builder
- Filename sanitizer
- Escaping rules
- URL normalization
- Unsafe schemes
- Length limits

## Validation Tests

Test:

- Missing required fields
- Invalid email
- Invalid coordinates
- Invalid dates
- Missing Wi-Fi password
- Invalid security type
- Oversized content
- Unsupported logo type
- Oversized logo

## Route Tests

Test:

```text
GET /qr
GET /qr/help
```

Verify:

- HTTP 200
- Public access
- Correct template
- Correct title
- QR stylesheet included
- QR script included
- No authentication redirect
- Existing layout used

## Browser Tests

Test when available:

- Chrome
- Chromium
- Firefox
- Edge
- Android Chrome
- Safari

## Responsive Widths

```text
320
375
425
768
1024
1440
```

## Scanner Tests

Manually verify:

- URL
- Text
- Email
- Phone
- SMS
- Wi-Fi
- vCard
- Location
- Calendar

Use:

- Android camera
- Google Lens
- iPhone camera when available
- A dedicated QR scanner

Test:

- Default colors
- Custom colors
- Logo
- No logo
- PNG
- SVG
- Screen display
- Printed sample

---

# 27. Acceptance Criteria

The implementation is complete only when all applicable criteria pass.

1. `/qr` loads without login.
2. `/qr/help` loads without login.
3. The module uses HelloTasks branding.
4. Existing HelloTasks navigation remains functional.
5. Users can select every supported QR type.
6. Each type has correct fields.
7. Required fields are validated.
8. Unsafe URLs are rejected.
9. Valid inputs create working QR codes.
10. Preview updates after content changes.
11. Preview updates after design changes.
12. Foreground color works.
13. Background color works.
14. Size selection works.
15. Margin selection works.
16. Error correction selection works.
17. Dot style works.
18. Corner style works.
19. Logo upload works.
20. Invalid logos are rejected.
21. Logo removal works.
22. PNG download works.
23. SVG download works.
24. Downloaded QR codes scan successfully.
25. Reset restores defaults.
26. Encoded payload can be viewed.
27. Encoded payload can be copied.
28. Mobile layout works at 320 px.
29. Keyboard navigation works.
30. Focus states are visible.
31. Validation is accessible.
32. No QR content is stored.
33. No database changes are introduced.
34. No Supabase changes are introduced.
35. No authentication changes are introduced.
36. No unrelated features are modified.
37. Existing tests pass.
38. New tests pass.
39. Production assets do not depend on a public CDN.
40. No sensitive payload data appears in logs.
41. No critical security regression is introduced.

---

# 28. Development Sequence

## Stage 1: Inspect

- Inspect repository
- Identify exact integration points
- Confirm test commands
- Confirm CSP
- Confirm layout
- Confirm public route pattern

Output an implementation map before editing.

## Stage 2: Dependency Decision

- Check whether a QR library already exists
- Compare current dependency versions
- Add the minimum dependency needed
- Document why it is required

## Stage 3: Route and Controller

- Add `/qr`
- Add `/qr/help`
- Register routes
- Add controller methods
- Keep routes public

## Stage 4: Views

- Create main view
- Create help view
- Add partials as needed
- Reuse existing layout

## Stage 5: Payload Builders

- Implement all QR payload formats
- Add escaping
- Add normalization
- Add tests

## Stage 6: Validation

- Implement field validation
- Add accessible error messages
- Add tests

## Stage 7: QR Rendering

- Initialize the QR library
- Add state management
- Add debounce
- Add preview
- Add reliability safeguards

## Stage 8: Customization

- Add colors
- Add size
- Add margin
- Add error correction
- Add dot style
- Add corner style

## Stage 9: Logo

- Add file input
- Validate image
- Preview image
- Apply image to QR
- Remove image
- Clean object URLs

## Stage 10: Downloads

- Add PNG
- Add SVG
- Add safe filenames
- Revalidate before export

## Stage 11: Reset and Payload Viewer

- Add reset
- Add confirmation logic
- Add encoded content viewer
- Add copy action

## Stage 12: Responsive and Accessibility

- Test mobile layout
- Test keyboard use
- Test focus
- Test screen-reader status messages
- Fix contrast issues

## Stage 13: Automated Testing

- Add unit tests
- Add route tests
- Run existing tests
- Run new tests
- Fix regressions

## Stage 14: Documentation

- Update README or module docs
- List dependency
- List routes
- Explain privacy behavior
- Explain testing
- Explain deployment verification

## Stage 15: Final Verification

- Check every acceptance criterion
- Report pass, fail, or not testable
- Report created files
- Report modified files
- Report commands run
- Report assumptions
- Report remaining risks

---

# 29. Verification Commands

Use commands supported by the repository.

At minimum, run the relevant equivalents of:

```bash
npm install
npm test
npm run lint
npm run format:check
npm run dev
```

Do not invent scripts that do not exist.

Inspect `package.json` first.

Also verify:

```text
GET /qr returns 200
GET /qr/help returns 200
```

Check browser console for errors.

Check server logs for errors.

Confirm existing HelloTasks pages still load.

---

# 30. Deployment Guidance

Do not change deployment configuration unless required.

Expected deployment pattern:

1. Commit changes.
2. Push feature branch.
3. Merge after review.
4. Pull on the HelloTasks server.
5. Install dependencies.
6. Run tests.
7. Restart the existing PM2 process.
8. Verify `/qr`.
9. Verify `/qr/help`.
10. Verify existing HelloTasks pages.

Do not assume the PM2 process name.

Inspect the current PM2 or ecosystem configuration.

No DNS change is required.

No Cloudflare tunnel change should be required.

No Nginx route change should be required when Express already handles application routes.

---

# 31. Rollback

Before deployment:

- Record the stable commit
- Commit QR work separately
- Avoid unrelated edits
- Avoid database migrations

Rollback:

1. Revert the QR feature commit.
2. Restore the previous lockfile when needed.
3. Run the package install command.
4. Restart the existing PM2 process.
5. Verify core HelloTasks routes.
6. Remove the navigation entry when the route no longer exists.

Phase 1 must remain easy to roll back because it has no database changes.

---

# 32. Future Supabase Architecture

Do not implement this section in Phase 1.

Use it only as future architectural guidance.

## Future Tables

```text
qr_projects
qr_dynamic_links
qr_scan_events
qr_project_tags
```

## Suggested Relationships

```text
auth.users
    ↓
qr_projects
    ↓
qr_dynamic_links
    ↓
qr_scan_events
```

## Future Requirements

- Supabase PostgreSQL
- Row Level Security
- User ownership policies
- SQL migrations in repository
- Indexed short codes
- Server-only service-role key
- Supabase Storage for persisted logos
- Signed URLs when appropriate
- Retention policy for scan events
- IP anonymization or hashing
- No raw Wi-Fi password storage by default

Do not create these tables until a later approved phase.

---

# 33. Coding Standards

Follow existing repository conventions.

Requirements:

- Clear function names
- Small focused functions
- Minimal duplication
- No dead code
- No unused dependencies
- No hard-coded production URLs where configuration already exists
- No sensitive values in logs
- Comments only where logic is not obvious
- User-facing text in reusable structures when practical
- Escape user content
- Validate external inputs
- Preserve lint rules

Do not refactor unrelated areas.

---

# 34. Codex Reporting Format

At the end, report:

## Repository Assessment

- Existing architecture found
- Integration approach used

## Files Created

List each file.

## Files Modified

List each file and why.

## Dependencies

List each added or removed dependency.

## Tests

List commands and results.

## Acceptance Criteria

Provide:

- Passed
- Failed
- Not testable locally

## Security and Privacy

Confirm:

- No payload storage
- No sensitive logging
- No database changes
- No Supabase key exposure
- Unsafe schemes rejected

## Remaining Risks

List only real unresolved issues.

## Manual Verification Needed

List scanner or browser tests that require human confirmation.

---

# 35. Stop Conditions

Stop implementation when:

- Phase 1 acceptance criteria are satisfied
- Existing tests pass
- New tests pass
- `/qr` and `/qr/help` work
- No unrelated features are modified
- No database work is introduced

Do not continue into:

- Saved QR projects
- Dynamic links
- Analytics
- Supabase tables
- Supabase Storage
- Payments
- Bulk generation
- QR API

Report future recommendations separately without implementing them.

---

# 36. Core Success Condition

The implementation is successful when:

```text
A user can open hellotasks.online/qr, select a QR type, enter valid information, customize the design, generate a reliable QR code, and download it as PNG or SVG without logging in and without the QR content being stored.
```
