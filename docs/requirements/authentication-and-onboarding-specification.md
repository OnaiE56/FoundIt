# FoundIt – Authentication & Onboarding Design Specification

> **Project:** FoundIt – University Lost and Found Management System  
> **Tagline:** *Find. Report. Reclaim.*  
> **Document Phase:** Phase 3 – Authentication & Onboarding Specification  
> **Status:** Specification & Architecture (Preparation Stage – No Implementation Code)  
> **Visual References:** `docs/ui-design/desktop/01-desktop-landing`, `02-desktop-sign up`, `03-desktop-login`, and `docs/ui-design/mobile/01-mobile-landing`  

---

## 1. Landing Page Specifications (Desktop & Mobile)

The Landing Page serves as the public front door to the platform, welcoming students, staff, and visitors while establishing institutional credibility.

### 1.1 Visual & Structural Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR                                                     │
│ [📍 FoundIt]        Home   Browse   About   Help    [Login] [Sign Up]│
├────────────────────────────────────────────────────────────────────────┤
│ HERO SECTION (Background: Campus photo with deep blue overlay)         │
│                                                                        │
│   FoundIt                                                           │
│   Lost and Found Management System for Our University                  │
│   Report • Find • Reclaim                                              │
│                                                                        │
│   [ Browse Items ]      [ Report Item ]                                │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ 3 VALUE PILLARS (Soft cards with icons & descriptions)                 │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐│
│ │ 🔍 Search Items   │  │ 🛡️ Report Safely   │  │ 👥 Connect Easily     ││
│ │ Fast multi-filter │  │ Secure submission  │  │ Verified recovery     ││
│ └───────────────────┘  └───────────────────┘  └───────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Desktop Specifications (>= 1025px)
- **Header**:
  - Left: FoundIt logo (Location pin icon + bold "FoundIt" text in `#0A192F`).
  - Center: Navigation links (`Home`, `Browse`, `About`, `Help`) with smooth hover underlines.
  - Right: `Login` (outline pill, `#0A192F` border) and `Sign Up` (solid blue `#2563EB` button).
- **Hero Banner**:
  - Full-width hero container (`min-height: 480px`) with high-resolution university campus photography.
  - Gradient overlay: `linear-gradient(135deg, rgba(10, 25, 47, 0.88) 0%, rgba(37, 99, 235, 0.55) 100%)`.
  - Headline: 32px / 2rem ExtraBold white typography.
  - Tagline: "Report • Find • Reclaim" in letter-spaced uppercase or highlighted bold subtext.
  - CTAs:
    - Primary CTA: `Browse Items` (`bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-6 py-3`).
    - Secondary CTA: `Report Item` (`bg-white/95 text-[#0A192F] hover:bg-white rounded-xl px-6 py-3`).
- **Feature Cards Grid**:
  - 3-column horizontal row directly below hero.
  - White cards (`#FFFFFF`) with subtle border (`#E2E8F0`), rounded corners (`16px`), and soft shadow (`--cf-shadow-card`).

### 1.3 Mobile Specifications (< 768px – Mobile First)
- **Header**:
  - Height: `56px`, sticky top.
  - Left: Logo icon + "FoundIt".
  - Right: Hamburger drawer toggle (minimum 44×44px tap target).
- **Hero Banner**:
  - Compact padding (`padding: 32px 16px`), height dynamically fitted to content.
  - Title: 24px Bold, high contrast white.
  - CTAs stack vertically into full-width buttons (`width: 100%`, height 46px):
    - Button 1: `Browse Items`
    - Button 2: `Report Item` (directs to login if unauthenticated)
- **Feature Cards**:
  - Single vertical column or horizontal swipe carousel.
  - Each pillar displayed as a compact card with left-aligned icon and text.

### 1.4 Tablet Responsiveness (768px – 1024px)
- **Header**:
  - Height: `60px`.
  - Navigation links (`Home`, `Browse`, `About`, `Help`) displayed in a compact horizontal menu with reduced gap (`gap-4` / 16px).
  - Action buttons (`Login`, `Sign Up`) use compact padding (`px-3 py-1.5`, text size 14px).
- **Hero Banner**:
  - Moderate padding (`padding: 44px 28px`), min-height `400px`.
  - Title: 28px Bold typography.
  - CTAs: Arranged side-by-side in a horizontal row (`flex flex-row gap-4 justify-start`) rather than stacked, maintaining 44px minimum touch targets.
- **Feature Cards**:
  - Arranged in a 2-column or 3-column responsive grid with reduced card margins (`gap-4` / 16px), adapting cleanly without text clipping.
- **Authentication Cards (Login & Register)**:
  - Card width is constrained to `460px` centered horizontally, with `px-6` margin gutters to avoid full-width stretching on tablets. Comfortable touch padding is maintained on all input fields.

---

## 2. Login Page Specifications

### 2.1 Layout & Visual Reference
- **Visual Reference**: `docs/ui-design/desktop/03-desktop-login.png..png`
- **Container**: Centered card (`max-width: 440px`) on soft slate page background (`#F8FAFC`) with subtle light blue decorative circular background shapes.
- **Top Bar**: Logo on top-left; "Don't have an account? **Sign Up**" navigation link on top-right.

### 2.2 Form Fields & Interaction Rules

| Field Name | Input Type | Icon | Placeholder | Validation Rules | Error State Message |
|---|---|---|---|---|---|
| **Email Address** | `email` | Mail envelope | `e.g. alex.morgan@example.edu` | • Required<br>• Trimmed<br>• Must pass basic email format regex | "Please enter a valid email address" |
| **Password** | `password` | Lock | `Enter your password` | • Required<br>• Minimum 8 characters | "Password is required (min 8 characters)" |
| **Remember Me** | `checkbox` | None | N/A | • Optional boolean | N/A |
| **Forgot Password**| `link` | None | `Forgot Password?` | • Navigates to password recovery modal/page | N/A |

### 2.3 Actions & Secondary Workflows
1. **Primary Button**: `Login`
   - Styling: Solid Blue (`#2563EB`), full width (`w-full`), height `46px`, `rounded-xl`, font-semibold.
   - States: Idle, Hover (`#1D4ED8`), Focus ring, Active/Press, Disabled/Loading (shows loading spinner with text *"Signing in..."*).
2. **Phase 2 Note on Google OAuth (DEC-005)**:
   - In accordance with team decision DEC-005, institutional Google OAuth is **deferred to Phase 2**.
   - For MVP, user authentication operates strictly via university email and password. In mockups where a Google button is depicted, it is marked as a planned post-MVP enhancement.
3. **Fictional Demo Account Switcher (Testing Aid)**:
   - Discreet developer/evaluator toolbar beneath the card:
     - `[Demo Student: Alex Morgan]` → Automatically fills `alex.morgan@example.edu`
     - `[Demo Admin: Safety Officer]` → Automatically fills `admin@campusfind.org`
   - *Security rule: Never stores plaintext passwords; merely triggers the mock authentication state.*

### 2.4 Error States & Login Abuse Protection
- **Field-level validation**: Inline red text (`#DC2626`, 13px) below the invalid input, with border highlighted in red (`#EF4444`).
- **Form-level alert**: Dismissible toast or red banner atop the card for invalid credentials:
  - *"Invalid email or password. Please verify your details or use Forgot Password."*
- **Login Abuse Protection (Rate Limiting & Anti-DoS)**:
  - To prevent Denial-of-Service attacks against students (where an attacker locks an innocent student's account by intentionally typing wrong passwords), **accounts are never permanently locked**.
  - **Tiered Defense Mechanism (Empirical recommendations to be calibrated in Sprint 2)**:
    1. *Attempts 1–3:* Immediate error response (*"Invalid email or password"*).
    2. *Attempts 4–5:* Server enforces a progressive delay (e.g., 2s to 5s exponential backoff), throttling automated credential-stuffing tools.
    3. *Attempts 6–9:* The login card requires a CAPTCHA or verification challenge.
    4. *Attempts 10+ within a 15-minute sliding window:* The client IP is temporarily throttled with **HTTP 429 Too Many Requests** (`Retry-After: 900`). The account owner receives a security alert email, but their account remains functional from verified devices.

### 2.5 Forgot Password Workflow & Screen Flow
1. **Trigger**: User clicks "Forgot Password?" link on the login card.
2. **Modal / View Display**:
   - Clean card header: *"Reset Password"* with subtitle *"Enter your university email to receive a secure recovery link."*
   - Field: Email Address (validated against basic email format).
   - Action: *"Send Reset Link"* button with loading state.
3. **Anti-User-Enumeration Submission Feedback**:
   - Regardless of whether the email exists in the database, the UI displays a neutral, secure confirmation:
     - *"If an account with that email exists, password reset instructions have been sent to your inbox."*
   - This prevents malicious actors from probing valid student email addresses.
4. **Email Dispatch**: Backend generates a cryptographically random, signed, single-use token with a 15-minute expiration and dispatches an email containing the URL: `#/reset-password?token=SECURE_TOKEN`.
5. **Reset Form Screen (`#/reset-password`)**:
   - Form fields: New Password (min 8 chars) and Confirm New Password (match check).
   - Action: *"Update Password"*.
   - Success: Shows success modal and redirects to `#/login`.

---

## 3. Registration Page Specifications

### 3.1 Layout & Visual Reference
- **Visual Reference**: `docs/ui-design/desktop/02-desktop-sign up.png..png`
- **Container**: Centered card (`max-width: 460px`) with clean white surface, soft border, and elevation.
- **Top Bar**: Logo on top-left; "Already have an account? **Login**" on top-right.

### 3.2 Form Fields & Interaction Rules

| Field Name | Input Type | Icon | Validation Rules | Error State Message |
|---|---|---|---|---|
| **Full Name** | `text` | User profile | • Required<br>• Min 2, Max 100 characters<br>• Alphabetical and standard name punctuation | "Please enter your full name" |
| **University Email** | `email` | Mail envelope | • Required<br>• Trimmed<br>• Basic email format validator<br>• Open valid format for MVP (DEC-004) | "Please enter a valid university email" |
| **Password** | `password` | Lock | • Required<br>• Min 8 characters<br>• Toggleable visibility (👁️) | "Password must be at least 8 characters" |
| **Confirm Password** | `password` | Lock check | • Required<br>• Must match `Password` exactly | "Passwords do not match" |

### 3.3 Compliance & Submission
- **Terms Disclaimer**:
  - *"By signing up, you agree to our Terms of Service and Privacy Policy."*
  - Links open respective institutional policy modals.
- **Primary Button**: `Register` / `Sign Up`
  - Solid Blue (`#2563EB`), full-width button.
- **Success Feedback**:
  - Upon submission, display success modal or green toast:
    - *"Registration successful! Please check your email to verify your account."*

---

## 4. Authentication Service / API Contract

The frontend service layer communicates with the backend using the following standard RESTful API contract. All authentication relies strictly on **server-managed HttpOnly cookie sessions** (DEC-001) and **session-bound CSRF tokens** (DEC-002).

### 4.1 Login Endpoint
- **URL**: `POST /api/v1/auth/login`
- **Authentication**: None (Public)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "alex.morgan@example.edu",
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
- **Response Headers**:
  - *If `rememberMe: false` (Standard Session)*:
    ```http
    Set-Cookie: cf_session=<session_id>; Path=/api; HttpOnly; SameSite=Lax; Secure
    Set-Cookie: XSRF-TOKEN=<csrf_token>; Path=/; SameSite=Lax; Secure
    ```
  - *If `rememberMe: true` (Persistent 14-Day Session)*:
    ```http
    Set-Cookie: cf_session=<session_id>; Path=/api; Max-Age=1209600; HttpOnly; SameSite=Lax; Secure
    Set-Cookie: XSRF-TOKEN=<csrf_token>; Path=/; Max-Age=1209600; SameSite=Lax; Secure
    ```
    *(Note: `Secure` flag is enabled in production HTTPS; disabled for local plain HTTP development).*
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "STUDENT",
      "studentId": "STU-88219",
      "avatarText": "AM",
      "isEmailVerified": true,
      "isStudentVerified": false
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "success": false, "message": "Invalid email or password" }`
  - `429 Too Many Requests`: `{ "success": false, "message": "Too many failed attempts. Please try again in 15 minutes." }`

### 4.2 Registration Endpoint
- **URL**: `POST /api/v1/auth/register`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "fullName": "Alex Morgan",
    "email": "alex.morgan@example.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully. A verification email has been dispatched.",
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "STUDENT",
      "isEmailVerified": false
    }
  }
  ```
- **Error Response (409 Conflict)**:
  ```json
  {
    "success": false,
    "message": "An account with this email address already exists"
  }
  ```

### 4.3 Logout Endpoint
- **URL**: `POST /api/v1/auth/logout`
- **Authentication**: Required (via `cf_session` cookie)
- **Headers**: `X-CSRF-Token: <csrf_token>`
- **Response Headers (Exact Path Clearance)**:
  ```http
  Set-Cookie: cf_session=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure
  Set-Cookie: XSRF-TOKEN=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 4.4 Get Current User (Session Verification)
- **URL**: `GET /api/v1/auth/me`
- **Authentication**: Required (via `cf_session` cookie; browser submits with `credentials: 'include'`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "STUDENT",
      "studentId": "STU-88219",
      "isEmailVerified": true,
      "isStudentVerified": false
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Session expired or invalid"
  }
  ```

### 4.5 Forgot Password Endpoint
- **URL**: `POST /api/v1/auth/forgot-password`
- **Request Body**: `{ "email": "alex.morgan@example.edu" }`
- **Success Response (200 OK - Anti-Enumeration)**:
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, password reset instructions have been sent."
  }
  ```

### 4.6 Reset Password Endpoint
- **URL**: `POST /api/v1/auth/reset-password`
- **Request Body**:
  ```json
  {
    "token": "d7a8e2b4f91c...",
    "newPassword": "NewSecurePassword123!"
  }
  ```- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. You may now log in with your new password."
  }
  ```

### 4.7 Student Email Verification Endpoint
- **URL**: `POST /api/v1/auth/verify-email`
- **Method**: `POST` (state-changing — sets `isEmailVerified = true` on the User record)
- **Flow**: The email verification link directs the student's browser to a **frontend route** (e.g., `#/verify-email?token=<raw_token>`). The frontend page extracts the token from the query string and submits it via a client-side `fetch()` to this endpoint. The backend hashes the received raw token, looks up the matching `VerificationToken` record by `tokenHash` where `type = VERIFY`, `expiresAt > NOW()`, and `usedAt IS NULL`, then atomically marks the token spent (`usedAt = NOW()`) and updates `User.isEmailVerified = true`.
- **Why not GET?**: A `GET` request to perform this operation would be unsafe — search engines, link-preview crawlers, and email security scanners can silently follow links and trigger a one-time verification token before the user even opens the email. Using `POST` from the frontend page ensures deliberate submission.
- **CSRF Required**: Yes (`X-CSRF-Token` header; session cookie must be present if the user is logged in; if the user is not logged in, the token itself proves intent and a fresh CSRF token is issued on the verification landing page).
- **Request Body**:
  ```json
  {
    "token": "v3r1fy_t0k3n_hex_string..."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Email verified successfully. You may now submit reports and file claims."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Token missing, expired, already used, or type mismatch.
  - `404 Not Found`: Token hash not found in `VerificationToken` table.

---

## 5. Session Management & Role-Based Access Design

### 5.1 Storage, Cookie Architecture & CSRF Protection
- **Server-Managed Session Architecture (DEC-001)**:
  - Authentication relies strictly on server-managed sessions stored through Prisma (`@quixo3/prisma-session-store`): SQLite during local development and PostgreSQL after the planned provider transition.
  - The session identifier is issued to the browser in an `HttpOnly`, `SameSite=Lax` cookie (`cf_session`).
  - **Zero Sensitive Data in Browser**: Plaintext passwords, hashes, and session tokens are **never** stored in browser `localStorage` or `sessionStorage`.
- **Session Lifetime Relationship (DEC-008)**:
  - *Standard Session (`rememberMe: false`)*: Ephemeral browser session cookie (cleared when browser closes). The server enforces a **2-hour sliding inactivity timeout** (each request refreshes the 2-hour window; 7,200 seconds of inactivity terminates the session).
  - *Persistent Session (`rememberMe: true`)*: Persistent cookie with a **14-day absolute lifetime** (`Max-Age=1209600`). Rolling activity renewals allow active students to stay logged in up to the 14-day window.
- **CSRF Protection Architecture (DEC-002)**:
  - The server generates a cryptographically secure, random 256-bit token (`crypto.randomBytes(32).toString('hex')`) stored in the server session (`req.session.csrfToken`).
  - The token is completely decoupled from `session_id` and does not leak session data.
  - Delivered via a readable cookie: `Set-Cookie: XSRF-TOKEN=<token>; Path=/; SameSite=Lax`.
  - Required in the `X-CSRF-Token` request header for all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Validated using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
  - **Cookie Path Handling**:
    - `cf_session` uses `Path=/api` to scope session transmission strictly to API routes.
    - `XSRF-TOKEN` uses `Path=/` so client-side JavaScript can read the cookie value.
    - On logout, each cookie is cleared using its **original matching path**.
- **Corrected Security Claims**:
  - *XSS Mitigation (Token Theft Prevention)*: `HttpOnly` cookies prevent malicious client-side JavaScript from directly exfiltrating session tokens. However, `HttpOnly` does **not** provide "XSS immunity" against Session Riding. Strict HTML entity escaping (`escapeHTML`) and CSP headers remain mandatory.
  - *CSRF Mitigation (Defense-in-Depth)*: `SameSite=Lax` cookies prevent cross-origin form POSTs, while the signed `X-CSRF-Token` header provides defense-in-depth across top-level navigations and subdomains.

### 5.2 Role-Based Routing & Access Matrix
The frontend router enforces client-side route guards for clean user experience:

| Route Path | View / Interface | Guest Access | Student Role | Admin Role | Guard Behavior If Unauthorized |
|---|---|---|---|---|---|
| `#/` | Landing Page | Yes | Yes | Yes | Allowed |
| `#/login` | Login Screen | Yes | Redirect `#/dashboard` | Redirect `#/admin` | Allowed |
| `#/register` | Registration Screen | Yes | Redirect `#/dashboard` | Redirect `#/admin` | Allowed |
| `#/browse` | Browse Items | Yes (public data masked) | Yes | Yes | Allowed |
| `#/item/:id` | Item Details | Yes (public data masked) | Yes (can claim) | Yes (can manage) | Allowed |
| `#/dashboard` | Student Dashboard | No | **Yes** | Redirect `#/admin` | Redirect `#/login` with return URL |
| `#/report` | Report Lost / Found | No | **Yes** | Yes | Redirect `#/login` |
| `#/my-reports`| My Reports | No | **Yes** | No | Redirect `#/login` |
| `#/my-claims` | My Claims | No | **Yes** | No | Redirect `#/login` |
| `#/profile` | Profile & Settings | No | **Yes** | Yes | Redirect `#/login` |
| `#/admin/*` | Admin Dashboard & Claims| No | **No (Forbidden)** | **Yes** | Redirect `#/dashboard` + "Access Denied" |

> **Security Disclaimer**: Client-side route guards are for **user experience navigation only**. The backend API is solely responsible for authenticating requests and rejecting unauthorized actions with HTTP 401/403 responses.

### 5.3 Administrator Account Provisioning Architecture (DEC-007)
- **Strict Role Isolation**: The public registration interface (`#/register`) registers users exclusively with the `STUDENT` role. There is no dropdown or parameter allowing self-assignment of administrative privileges.
- **Provisioning Mechanisms**:
  1. **System Bootstrap / Initial Seeding (MVP)**: Initial administrator accounts are provisioned via a secure command-line backend seed script during server setup. This is the **only** supported admin creation method in MVP, consistent with DEC-007.
  2. **Internal Admin Invitation (Phase 2 — deferred)**: After MVP, an authenticated administrator may invite additional university staff members via an internal admin console endpoint (`POST /api/v1/admin/users/invite`). This generates a cryptographically secure, single-use activation link. This endpoint is **not part of the MVP scope** and must not be implemented until explicitly approved.

### 5.4 Student Verification Policy (DEC-006)
In accordance with team decision DEC-006, verification is separated into two distinct tiers:
1. **Email Ownership Verification (`is_email_verified`)**:
   - Sent automatically upon registration via signed token link.
   - Gating Policy: **Browsing is open to all users.** Submitting an item report or filing an ownership claim requires a verified email address (`is_email_verified: true`) to prevent spam.
2. **Institutional Student Verification (`is_student_verified`)**:
   - Confirms the user is a currently enrolled university student.
   - Mechanism: Institutional integration method is pending university administrative selection (e.g. manual student ID review by staff, or future institutional registry integration). It is **not** assumed to be automated in the MVP.

### 5.5 Phase 2 Deferred Feature: Google OAuth (DEC-005)
- Google OAuth is deferred to Phase 2 (post-MVP).
- When implemented, the backend will cryptographically verify the Google `id_token` against Google's public JSON Web Key Sets (`https://www.googleapis.com/oauth2/v3/certs`), verifying `aud`, `iss`, `exp`, and `email_verified: true`. It will **not** rely on unverified client payloads or solely on the `hd` claim.

### 5.6 Session Termination on Logout
- Calling `POST /api/v1/auth/logout` terminates the session server-side (`req.session.destroy()`), deletes the session record from PostgreSQL, and issues matching cookie clearance headers.

---

## 6. Authentication Test Cases (QA Matrix)

| Test ID | Test Scenario | Input Data | Expected Result | Pass Criteria |
|---|---|---|---|---|
| **`TC-AUTH-001`** | Successful student login | Valid student email & password | Authenticates, sets `cf_session` cookie, redirects to `#/dashboard` | Student dashboard loaded; session cookie set |
| **`TC-AUTH-002`** | Successful admin login | Valid admin email & password | Authenticates, sets admin role, redirects to `#/admin` | Admin panel loaded with admin metrics |
| **`TC-AUTH-003`** | Invalid password | Valid email, incorrect password | Form shows error alert; password input cleared | Error message displayed, no session cookie |
| **`TC-AUTH-004`** | Non-existent account | Unknown email address | Form shows error alert: "Invalid email or password" | Generic error displayed (anti-enumeration) |
| **`TC-AUTH-005`** | Empty field submission | Blank email or blank password | Client-side validation triggers immediately | Red input borders, inline error text |
| **`TC-AUTH-006`** | Malformed email input | `user@invalid` or `plainaddress` | Email validator flags input as invalid | "Please enter a valid email address" |
| **`TC-AUTH-007`** | Password mismatch on sign-up | `Password123` vs `Password456` | Confirm password field flags error | "Passwords do not match" message |
| **`TC-AUTH-008`** | Short password rejection | Password `< 8` characters | Validator flags error before submission | "Password must be at least 8 characters" |
| **`TC-AUTH-009`** | Password visibility toggle | Click 👁️ icon | Input type toggles between `password` and `text` | Characters become visible/hidden |
| **`TC-AUTH-010`** | Student accessing admin route | Logged in as Student, visits `#/admin` | Route guard intercepts navigation | Redirected to `#/dashboard` with alert |
| **`TC-AUTH-011`** | Guest accessing private route | Unauthenticated user visits `#/my-claims` | Route guard redirects to `#/login` | Redirected to login with return URL |
| **`TC-AUTH-012`** | User logout | Clicks Logout in sidebar/profile | Session destroyed; cookies cleared with matching paths | Redirected to Landing; session terminated |
| **`TC-AUTH-013`** | Forgot Password – Registered Email | Valid student email | Generic success message displayed; reset token generated | Email dispatched; anti-enumeration feedback |
| **`TC-AUTH-014`** | Forgot Password – Unknown Email | Non-existent email | **Exact same** generic success message displayed | No email dispatched; no user enumeration leak |
| **`TC-AUTH-015`** | Password Reset – Valid Token | Submits valid token + new password | Password updated in database; old password rejected | 200 OK; redirects to login |
| **`TC-AUTH-016`** | Password Reset – Expired Token | Submits token older than 15 min | Rejection with HTTP 400/410 | Error alert; prompts requesting new link |
| **`TC-AUTH-017`** | Email Verification – Successful | Clicks verification link with valid token | Account marked `isEmailVerified: true` | Reporting and claiming features unlocked |
| **`TC-AUTH-018`** | Email Verification – Gated Action | Unverified student submits report/claim | In-app verification banner blocks submission | User prompted to verify email first |
| **`TC-AUTH-019`** | Progressive Delay on Failed Logins | 4th and 5th failed login attempt | Server applies progressive delay (2s to 5s backoff) | Response delayed; automated attacks throttled |
| **`TC-AUTH-020`** | Temporary Rate-Limiting Throttling | 10+ failed attempts from same IP in 15m | Server returns HTTP 429 Too Many Requests | Temporary cooldown; account NOT permanently locked |
| **`TC-AUTH-021`** | Remember Me Cookie Lifecycle | Login with Remember Me checked vs unchecked | Checked sets 14-day persistent cookie; unchecked sets session cookie | Session cookie cleared on browser close |
| **`TC-AUTH-022`** | CSRF Protection Enforcement | State-changing request sent without `X-CSRF-Token` | Server rejects request with HTTP 403 Forbidden | Request blocked; data mutation prevented |

---

## 7. Requirements Traceability

| Requirement ID | Specific Requirement | Specification Fulfillment Section |
|---|---|---|
| **`REQ-AUTH-001`** | Student & Admin Login | Sections 2.1, 2.2, 4.1, 6 (`TC-AUTH-001`, `002`) |
| **`REQ-AUTH-002`** | Student Registration | Sections 3.1, 3.2, 4.2, 6 (`TC-AUTH-007`, `008`) |
| **`REQ-AUTH-003`** | Role-Based Access Functionality | Sections 5.2, 6 (`TC-AUTH-010`, `011`) |
| **`REQ-AUTH-004`** | Password Recovery Workflow | Sections 2.5, 4.5, 4.6, 6 (`TC-AUTH-013`, `014`, `015`, `016`) |
| **`REQ-AUTH-005`** | Email Verification & Action Gating | Sections 4.7, 5.4, 6 (`TC-AUTH-017`, `018`) |
| **`REQ-AUTH-006`** | Server-Managed Session Cookies | Sections 4.1, 4.3, 5.1, 6 (`TC-AUTH-012`, `021`) |
| **`REQ-AUTH-007`** | CSRF Defense-in-Depth | Sections 4.1, 4.3, 5.1, 6 (`TC-AUTH-022`) |
| **`NFR-RESP-001`** | Mobile-First Adaptation | Section 1.3 (56px header, stacked CTAs, touch targets) |
| **`NFR-A11Y-001`** | Accessible Labels & Form Validation | Sections 2.2, 3.2 (ARIA labels, high contrast, inline errors) |
| **`NFR-SECU-001`** | Secure Handling & Non-Destructive Abuse Control | Sections 2.4, 5.1, 6 (`TC-AUTH-019`, `020`) |

---

## 8. Technical Dependencies & Integration Pre-requisites

1. **Backend Authentication & Session Services**:
   - `express-session`: Server-side session management.
   - `@quixo3/prisma-session-store`: Prisma-backed session store for `express-session`; the same store model supports SQLite locally and PostgreSQL later.
   - `bcrypt`: Password hashing (work factor **12** — consistent with `database-design.md`).
   - `crypto` (Node.js built-in): CSRF token generation (`crypto.randomBytes(32)`), token hashing (`crypto.createHash('sha256')`), and constant-time validation (`crypto.timingSafeEqual`).
2. **Database Tables Required**:
   - `User` schema matching ERD (`id`, `fullName`, `email`, `passwordHash`, `role`, `isEmailVerified`, `isStudentVerified`, `studentId`).
   - `Session` table used by the Prisma session store (`id`, `sid`, `sess`, `expire`); Prisma fields `data` and `expiresAt` map to `sess` and `expire`.
   - `VerificationToken` table for password reset and email verification tokens (`id`, `userId`, `tokenHash`, `type`, `expiresAt`, `usedAt`, `createdAt`). See `database-design.md` Section 3.7.
3. **Password Recovery & Verification Email Infrastructure**:
   - SMTP or transactional email provider (e.g., SendGrid, Amazon SES, or institutional SMTP relay) to dispatch password reset and email verification tokens.
   - Emails contain the **raw token** (not the hash) embedded in a link pointing to the frontend verification route (e.g., `https://campusfind.university.edu/#/verify-email?token=<raw>`).

### Implementation Notes (Future Task — Do Not Implement Now)
- **`frontend/js/config.js` role constants**: The file currently defines `ROLES: { STUDENT: 'student', ADMIN: 'admin' }` with lowercase strings. When implementation begins, this must be updated to `ROLES: { STUDENT: 'STUDENT', ADMIN: 'ADMIN' }` to match the PostgreSQL enum values returned by the API (`"role": "STUDENT"`). This change must be coordinated with all frontend route guard comparisons at the same time.
