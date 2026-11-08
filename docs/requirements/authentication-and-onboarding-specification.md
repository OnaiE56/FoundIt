# CampusFind – Authentication & Onboarding Design Specification

> **Project:** CampusFind – University Lost and Found Management System  
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
│ [📍 CampusFind]        Home   Browse   About   Help    [Login] [Sign Up]│
├────────────────────────────────────────────────────────────────────────┤
│ HERO SECTION (Background: Campus photo with deep blue overlay)         │
│                                                                        │
│   CampusFind                                                           │
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
  - Left: CampusFind logo (Location pin icon + bold "CampusFind" text in `#0A192F`).
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
  - Left: Logo icon + "CampusFind".
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
2. **Divider**: Centered "OR" text with subtle horizontal border lines (`#E2E8F0`).
3. **Institutional SSO Button**: `Continue with Google`
   - Styling: White background, 1.5px border (`#E2E8F0`), Google "G" SVG icon, full width.
   - Purpose: Directs to institutional Google Workspace OAuth.
4. **Fictional Demo Account Switcher (Testing Aid)**:
   - Discreet developer/evaluator toolbar beneath the card:
     - `[Demo Student: Alex Morgan]` → Automatically fills `alex.morgan@example.edu`
     - `[Demo Admin: Safety Officer]` → Automatically fills `admin@campusfind.org`
   - *Security rule: Never stores plaintext passwords; merely triggers the mock authentication state.*

### 2.4 Error States & User Feedback
- **Field-level validation**: Inline red text (`#DC2626`, 13px) below the invalid input, with border highlighted in red (`#EF4444`).
- **Form-level alert**: Dismissible toast or red banner atop the card for invalid credentials:
  - *"Invalid email or password. Please verify your details or use Forgot Password."*
- **Account locked banner**: Displayed if brute-force threshold (e.g. 5 consecutive failed attempts) is exceeded.

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
| **University Email** | `email` | Mail envelope | • Required<br>• Trimmed<br>• Basic email format validator<br>• Non-hardcoded institutional domain | "Please enter a valid university email" |
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
    - *"Registration successful! Redirecting you to your student dashboard..."*

---

## 4. Authentication Service / API Contract

The frontend service layer will communicate with the backend using the following standard RESTful API contract:

### 4.1 Login Endpoint
- **URL**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "alex.morgan@example.edu",
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "student",
      "studentId": "STU-88219",
      "avatarText": "AM"
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

### 4.2 Registration Endpoint
- **URL**: `POST /api/v1/auth/register`
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
    "message": "User registered successfully",
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "student"
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
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 4.4 Get Current User (Session Verification)
- **URL**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_student_01",
      "fullName": "Alex Morgan",
      "email": "alex.morgan@example.edu",
      "role": "student",
      "studentId": "STU-88219"
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Session expired or invalid token"
  }
  ```

### 4.5 Forgot Password Endpoint
- **URL**: `POST /api/v1/auth/forgot-password`
- **Request Body**:
  ```json
  {
    "email": "alex.morgan@example.edu"
  }
  ```
- **Success Response (200 OK - Always returned to prevent user enumeration)**:
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
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. You may now log in with your new password."
  }
  ```
- **Error Response (400 Bad Request / 410 Gone)**:
  ```json
  {
    "success": false,
    "message": "Password reset token is invalid or has expired."
  }
  ```

### 4.7 Student Email Verification Endpoint
- **URL**: `POST /api/v1/auth/verify-email`
- **Request Body**:
  ```json
  {
    "token": "v3r1fy_t0k3n_99..."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Email verified successfully. You may now submit reports and file claims."
  }
  ```

### 4.8 Resend Email Verification Endpoint
- **URL**: `POST /api/v1/auth/resend-verification`
- **Headers**: `Authorization: Bearer <token>` or Request Body `{ "email": "alex.morgan@example.edu" }`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "A new verification email has been sent."
  }
  ```

---

## 5. Session Management & Role-Based Access Design

### 5.1 Storage, Cookies & Secure Session Handling
- **In Mock / Development Mode**:
  - Active session state is managed in an in-memory reactive store (`state.js`).
  - `localStorage` retains only non-sensitive tokens (`cf_mock_token`) and user display preferences (`cf_user_role`, `cf_display_name`).
  - **Zero Sensitive Data Rule**: Plaintext passwords, password hashes, and student personal identity documents are **never** stored in browser storage.
- **In Production Backend Mode (Recommended Standard)**:
  - Authentication tokens must be set by the server using **`HttpOnly`**, **`Secure`**, and **`SameSite=Strict`** cookies:
    ```http
    Set-Cookie: access_token=eyJhbGciOi...; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=900
    Set-Cookie: refresh_token=d7f2a18c...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
    ```
  - **Security Advantages**:
    1. **XSS Immunity**: JavaScript running in the browser cannot access `HttpOnly` cookies, preventing credential theft via Cross-Site Scripting.
    2. **CSRF Protection**: `SameSite=Strict` guarantees the browser will not send cookies on cross-origin requests.
    3. **Transport Security**: `Secure` guarantees transmission occurs strictly over HTTPS.
  - The frontend client simply includes `credentials: 'include'` on `fetch()` calls; the browser automatically and securely manages cookie attachment.

### 5.2 Role-Based Routing & Access Matrix
The frontend router enforces client-side route guards for clean user experience:

| Route Path | View / Interface | Guest Access | Student Role | Admin Role | Guard Behavior If Unauthorized |
|---|---|---|---|---|---|
| `#/` | Landing Page | Yes | Yes (or redirect to dashboard) | Yes (or redirect to admin) | Allowed |
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

### 5.3 Administrator Account Provisioning Architecture
- **Strict Role Isolation**: The public registration interface (`#/register`) registers users exclusively with the `student` role. There is no dropdown or parameter allowing self-assignment of administrative privileges.
- **Provisioning Mechanisms**:
  1. **System Bootstrap / Initial Seeding**: Initial administrator accounts are provisioned via a secure command-line backend seed script during server setup.
  2. **Internal Admin Invitation**: Existing administrators can invite university staff members via an internal admin console (`POST /api/v1/admin/users/invite`), generating a cryptographically secure, single-use activation link.
  3. **Institutional SSO Role Mapping**: If the university uses Google Workspace or SAML/Active Directory, the backend inspects the user's institutional security group/domain upon first login and maps designated staff emails to the `admin` role automatically.

### 5.4 Student Email Verification Policy (Gated Actions)
- **Policy Objective**: Balance immediate, frictionless onboarding with anti-spam protection for reporting and claims.
- **Workflow**:
  1. Upon registration, the account is created with `email_verified: false` and a verification email containing a secure token is dispatched immediately.
  2. **Ungated Privileges (Immediate Access)**: Unverified students can log in, view the Student Dashboard, browse all reported items, and search campus records.
  3. **Verification-Gated Actions**: Attempting to submit a lost/found report or filing an ownership claim prompts an in-app verification banner:
     - *"Please verify your student email address before reporting an item or submitting a claim. [Resend Verification Link]"*
  4. Once the student clicks the link in their inbox (`#/verify-email?token=...`), the backend marks `email_verified: true` and all features unlock immediately.

### 5.5 Google OAuth Account Linking & Fallback Behaviour
- **Workflow**:
  1. User clicks *"Continue with Google"*.
  2. Browser navigates to the backend OAuth authorization URL: `GET /api/v1/auth/google`.
  3. Google authenticates the student and redirects back to backend callback: `GET /api/v1/auth/google/callback`.
  4. **Account Linking Logic**:
     - *Existing Email Match*: If a CampusFind account with the returned Google email already exists, the backend links `google_id` to that user record and logs them in seamlessly.
     - *New Student*: If no account exists, the backend creates a new student record using Google's verified name and email, marking `email_verified: true` automatically.
     - *Institutional Domain Restriction*: If institutional policy requires it, the backend verifies the `hd` (hosted domain) claim equals the approved campus domain (e.g. `university.edu`). If unauthorized, login is rejected with an error.
  5. **Fallback & Error Handling**:
     - If the student denies Google permissions or cancels: Redirected back to `#/login` with an informational toast: *"Google sign-in was canceled. You can sign in using your standard university credentials."*
     - If Google services are unreachable: User can immediately fall back to standard email/password login or password reset.

### 5.6 Backend JWT Revocation Strategy
To ensure immediate invalidation upon logout or credential reset:
- **Two-Tier Token Architecture**:
  1. **Short-Lived Access Token (TTL: 15 minutes)**: Contains minimal claims (`sub`, `role`, `jti`, `exp`). Verified statelessly on each request.
  2. **Rotating Refresh Token (TTL: 7 days)**: Stored hashed in the database (`refresh_tokens` table) tied to `user_id`, `family_id`, and `expires_at`.
- **Revocation on Logout**:
  - Calling `POST /api/v1/auth/logout` immediately deletes the refresh token record from the database and clears the auth cookies.
- **Access Token Blacklist (Redis Cache)**:
  - When a user logs out, the backend writes the access token's unique ID (`jti`) into a Redis blacklist with a TTL equal to its remaining validity (max 15 minutes).
  - Any subsequent API request bearing a blacklisted `jti` is rejected with HTTP 401 Unauthorized.
  - Automatic memory cleanup occurs as expired `jti` keys drop off Redis naturally.

---

## 6. Authentication Test Cases (QA Matrix)

| Test ID | Test Scenario | Input Data | Expected Result | Pass Criteria |
|---|---|---|---|---|
| **TC-AUTH-01** | Successful student login | Valid student email & password | Authenticates, sets student role, redirects to `#/dashboard` | User welcomed with student dashboard |
| **TC-AUTH-02** | Successful admin login | Valid admin email & password | Authenticates, sets admin role, redirects to `#/admin` | Admin panel loaded with admin metrics |
| **TC-AUTH-03** | Invalid password | Valid email, incorrect password | Form shows error alert; password input cleared | Error message displayed, no redirect |
| **TC-AUTH-04** | Non-existent account | Unknown email address | Form shows error alert: "Invalid credentials" | Error message displayed, no crash |
| **TC-AUTH-05** | Empty field submission | Blank email or blank password | Client-side validation triggers immediately | Red input borders, inline error text |
| **TC-AUTH-06** | Malformed email input | `user@invalid` or `plainaddress` | Email validator flags input as invalid | "Please enter a valid email address" |
| **TC-AUTH-07** | Password mismatch on sign-up | `Password123` vs `Password456` | Confirm password field flags error | "Passwords do not match" message |
| **TC-AUTH-08** | Short password rejection | Password `< 8` characters | Validator flags error before submission | "Password must be at least 8 characters" |
| **TC-AUTH-09** | Password visibility toggle | Click 👁️ icon | Input type toggles between `password` and `text` | Characters become visible/hidden |
| **TC-AUTH-10** | Student accessing admin route | Logged in as Student, visits `#/admin` | Route guard intercepts navigation | Redirected to `#/dashboard` with alert |
| **TC-AUTH-11** | Guest accessing private route | Unauthenticated user visits `#/my-claims` | Route guard redirects to `#/login` | Redirected to login with query param |
| **TC-AUTH-12** | User logout | Clicks Logout in sidebar/profile | Session cleared, redirected to Landing | Session token removed, login required |

---

## 7. Requirements Traceability

This specification directly fulfills the requirements established in project documentation:

| Requirement Reference | Specific Requirement | Specification Fulfillment Section |
|---|---|---|
| **REQ-AUTH-01** | Student & Admin Login | Sections 2.1, 2.2, 4.1, 6 (TC-01, TC-02) |
| **REQ-AUTH-02** | Student Registration | Sections 3.1, 3.2, 4.2, 6 (TC-07, TC-08) |
| **REQ-AUTH-03** | Role-Based Access Functionality | Sections 5.2, 6 (TC-10, TC-11) |
| **NFR-RESP-01** | Mobile-First Adaptation | Section 1.3 (56px header, stacked CTAs, touch targets) |
| **NFR-A11Y-01** | Accessible Labels & Form Validation | Sections 2.2, 3.2 (ARIA labels, high contrast, inline errors) |
| **NFR-SECU-01** | Secure Handling & Zero Secret Exposure | Section 5.1 (No plaintext passwords in localStorage, token policy) |

---

## 8. Technical Dependencies & Integration Pre-requisites

For successful full-stack delivery, the following external and backend dependencies must be coordinated with the respective team leads:

1. **Backend Authentication Service**:
   - Password hashing module using `bcrypt` (cost factor 10+) or `argon2id`.
   - JWT token generation service with expiration (e.g. 15-minute access token + rotating refresh token).
2. **Database User Table**:
   - Schema matching the ERD (`user_id`, `full_name`, `email`, `password_hash`, `role`, `created_at`).
   - Unique index on `email` column to prevent duplicate account creation.
3. **Password Recovery Infrastructure**:
   - SMTP or transactional email provider (e.g., SendGrid, Amazon SES, or institutional SMTP relay) to dispatch password-reset magic links.
4. **Institutional Google Workspace SSO**:
   - Registered Google Cloud Console project with OAuth 2.0 Client ID and secret.
   - Authorized redirect URIs configured for development (`localhost`) and staging.

---

## Summary

This concludes the **Authentication and Onboarding Design Specification**. All deliverables requested have been documented and aligned with the UI mockups.

Please review this specification and let me know when you approve proceeding to the next step.
