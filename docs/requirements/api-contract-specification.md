# FoundIt – REST API Contract Specification

> **Project:** FoundIt – University Lost and Found Management System  
> **API Version:** v1 (`/api/v1`)  
> **Specification Version:** 1.0.0  
> **Stage:** Project Foundation and Technical Architecture Specification  
> **Format:** RESTful JSON  

---

## 1. Global Architectural Standards

### 1.1 Base URL & Routing
All API endpoints are served under the versioned base path:
```
/api/v1
```

### 1.2 Session Authentication (DEC-001)
Authentication is managed exclusively via server-managed, stateful sessions:
- **Session Cookie**: `cf_session`
  - Attributes: `HttpOnly; SameSite=Lax; Path=/api; Max-Age=<duration>; Secure (in production)`
  - Standard session duration: 2-hour sliding inactivity timeout.
  - Persistent ("Remember Me") session duration: 14 days (`Max-Age=1209600`).
- No bearer JWTs are stored in browser `localStorage` or `sessionStorage`.

### 1.3 CSRF Protection Architecture (DEC-002)
All state-changing HTTP requests (`POST`, `PATCH`, `PUT`, `DELETE`) require a valid session-bound CSRF token:
- **CSRF Cookie**: `XSRF-TOKEN`
  - Attributes: `Path=/; SameSite=Lax; Secure (in production)`
  - **Not `HttpOnly`**: JavaScript reads this cookie and attaches its value to the `X-CSRF-Token` HTTP header on mutating fetch requests.
- **Header**: `X-CSRF-Token: <token>`
- **Token Validation**: The backend extracts `req.headers['x-csrf-token']` and compares it against `req.session.csrfToken` using constant-time string comparison (`crypto.timingSafeEqual`). If invalid or missing, the server responds with `HTTP 403 Forbidden` (`CSRF_TOKEN_INVALID`).
- **Cookie Clearing Mismatch Prevention**: On session termination (`POST /api/v1/auth/logout`), the server must explicitly clear `cf_session` using `Path=/api` and clear `XSRF-TOKEN` using `Path=/`.

### 1.4 Standard JSON Envelopes

#### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The submitted payload failed validation.",
    "details": [
      {
        "field": "itemName",
        "message": "Item name is required and must be between 3 and 120 characters."
      }
    ]
  }
}
```

### 1.5 Standard Error Codes
| HTTP Status | Error Code | Meaning |
|---|---|---|
| `400 Bad Request` | `VALIDATION_FAILED` | Request body or query parameters failed Zod schema validation |
| `401 Unauthorized` | `UNAUTHORIZED` | No active session cookie or session has expired |
| `403 Forbidden` | `FORBIDDEN` | Insufficient role permissions or unverified email |
| `403 Forbidden` | `CSRF_TOKEN_INVALID` | Missing or mismatched `X-CSRF-Token` header |
| `404 Not Found` | `NOT_FOUND` | Requested resource (item, claim, user) does not exist |
| `409 Conflict` | `CONFLICT` | Resource already exists (duplicate email, duplicate claim) |
| `429 Too Many Requests` | `RATE_LIMITED` | Rate limit exceeded (progressive backoff or IP cap) |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled server error |

---

## 2. Authentication & Onboarding Module

Detailed workflow specifications are defined in [`docs/requirements/authentication-and-onboarding-specification.md`](authentication-and-onboarding-specification.md). Below is the consolidated endpoint contract:

### 2.1 Register New Account
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Public
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane.doe@university.edu",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
        "email": "jane.doe@university.edu",
        "fullName": "Jane Doe",
        "role": "STUDENT",
        "isEmailVerified": false,
        "isStudentVerified": false,
        "createdAt": "2026-11-11T12:00:00.000Z"
      },
      "message": "Registration successful. Please check your email to verify your account."
    }
  }
  ```
- **Set-Cookie Headers**:
  - `cf_session=...; Path=/api; HttpOnly; SameSite=Lax; Secure`
  - `XSRF-TOKEN=...; Path=/; SameSite=Lax; Secure`

### 2.2 User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "jane.doe@university.edu",
    "password": "Password123!",
    "rememberMe": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
        "email": "jane.doe@university.edu",
        "fullName": "Jane Doe",
        "role": "STUDENT",
        "isEmailVerified": true,
        "isStudentVerified": false
      }
    }
  }
  ```
- **Set-Cookie Headers**:
  - If `rememberMe = true`: `Max-Age=1209600` (14 days).
  - If `rememberMe = false`: Session cookie (deleted upon browser close or 2-hour idle).

### 2.3 User Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: Authenticated
- **CSRF Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully."
    }
  }
  ```
- **Set-Cookie Headers (Explicit Path Clearance)**:
  - `Set-Cookie: cf_session=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`
  - `Set-Cookie: XSRF-TOKEN=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`

### 2.4 Get Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: Authenticated
- **CSRF Required**: No (safe idempotent read)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
        "email": "jane.doe@university.edu",
        "fullName": "Jane Doe",
        "role": "STUDENT",
        "isEmailVerified": true,
        "isStudentVerified": false
      }
    }
  }
  ```

### 2.5 Request Password Reset
- **Endpoint**: `POST /api/v1/auth/forgot-password`
- **Access**: Public
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "jane.doe@university.edu"
  }
  ```
- **Response (200 OK - Generic message preventing email enumeration)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "If that email address exists in our system, a password reset link has been dispatched."
    }
  }
  ```

### 2.6 Confirm Password Reset
- **Endpoint**: `POST /api/v1/auth/reset-password`
- **Access**: Public
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "token": "d7a4f918e...",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Password has been successfully updated. Please log in with your new password."
    }
  }
  ```

### 2.7 Verify Email Address
- **Endpoint**: `POST /api/v1/auth/verify-email`
- **Access**: Public
- **CSRF Required**: Yes (a fresh CSRF token is issued on the frontend verification landing page before submission)
- **Flow**: The email link navigates the browser to the frontend route `#/verify-email?token=<raw_token>`. The frontend page extracts the token from the query string and submits it via `fetch()` to this `POST` endpoint. `GET` is not used because email scanners and link-preview crawlers can silently follow `GET` links and inadvertently consume a one-time token before the student sees the email.
- **Request Body**:
  ```json
  {
    "token": "hex_encoded_raw_token_from_email_link..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Email address verified successfully."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` / `TOKEN_INVALID`: Token missing, expired (`expiresAt < NOW()`), already spent (`usedAt IS NOT NULL`), or type mismatch.
  - `404 Not Found` / `NOT_FOUND`: Token hash not found in `VerificationToken` table.

### 2.8 Resend Verification Email
- **Endpoint**: `POST /api/v1/auth/resend-verification`
- **Access**: Authenticated
- **CSRF Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "A new verification email has been sent."
    }
  }
  ```

---

## 3. Categories Module

### 3.1 Get All Categories
- **Endpoint**: `GET /api/v1/categories`
- **Access**: Public (no authentication required)
- **CSRF Required**: No
- **Purpose**: Returns the full list of item categories used to populate category dropdowns in the report submission form and filter chips on the browse page. Data is seeded at deployment time and changes infrequently, so clients may cache this response.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "categories": [
        {
          "id": "11111111-0000-0000-0000-000000000001",
          "name": "Electronics",
          "slug": "electronics",
          "iconName": "laptop"
        },
        {
          "id": "11111111-0000-0000-0000-000000000002",
          "name": "Keys & ID Cards",
          "slug": "keys-cards",
          "iconName": "key"
        },
        {
          "id": "11111111-0000-0000-0000-000000000003",
          "name": "Books & Notebooks",
          "slug": "books-stationery",
          "iconName": "book-open"
        },
        {
          "id": "11111111-0000-0000-0000-000000000004",
          "name": "Bags & Backpacks",
          "slug": "bags-backpacks",
          "iconName": "briefcase"
        },
        {
          "id": "11111111-0000-0000-0000-000000000005",
          "name": "Clothing & Accessories",
          "slug": "clothing",
          "iconName": "shirt"
        },
        {
          "id": "11111111-0000-0000-0000-000000000006",
          "name": "Water Bottles",
          "slug": "bottles",
          "iconName": "coffee"
        },
        {
          "id": "11111111-0000-0000-0000-000000000007",
          "name": "Other Items",
          "slug": "other",
          "iconName": "archive"
        }
      ]
    }
  }
  ```

> **Source of Truth**: The category list above matches the database seed configuration in `docs/system-design/database-design.md` Section 8.1. The `frontend/js/config.js` prototype `CATEGORIES` array differs (8 entries, different slugs/icons) and must be synchronized with the database seed list during implementation.

---

## 4. Item Reports Module

### 4.1 Report a Lost or Found Item
- **Endpoint**: `POST /api/v1/items`
- **Access**: Authenticated + Verified Email (`isEmailVerified === true`)
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "itemName": "Black Dell XPS 15 Laptop",
    "categoryId": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "reportType": "FOUND",
    "description": "Found inside Lecture Hall 3 on the 4th row. Screen intact, slight sticker residue on lid.",
    "location": "Science Complex - Lecture Hall 3",
    "dateReported": "2026-11-10T14:30:00.000Z",
    "contactMethod": "WHATSAPP",
    "contactValue": "+233201234567",
    "imageUrl": "https://pub-blob.vercel-storage.com/campusfind/items/laptop-abc123.jpg"
  }
  ```
  `contactMethod` and `contactValue` are optional; when a phone number is used, include its country code (for example, `+233201234567`).
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "item": {
        "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
        "itemName": "Black Dell XPS 15 Laptop",
        "categoryId": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
        "category": {
          "name": "Electronics",
          "slug": "electronics",
          "iconName": "laptop"
        },
        "reportType": "FOUND",
        "description": "Found inside Lecture Hall 3 on the 4th row. Screen intact, slight sticker residue on lid.",
        "location": "Science Complex - Lecture Hall 3",
        "dateReported": "2026-11-10T14:30:00.000Z",
        "status": "ACTIVE",
        "imageUrl": "https://pub-blob.vercel-storage.com/campusfind/items/laptop-abc123.jpg",
        "createdAt": "2026-11-11T12:30:00.000Z"
      }
    }
  }
  ```

### 3.2 Browse & Search Items
- **Endpoint**: `GET /api/v1/items`
- **Access**: Public
- **CSRF Required**: No
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `type` | String | No | None | Filter by `LOST` or `FOUND` |
  | `category` | String (UUID or slug) | No | None | Filter by category ID or slug |
  | `search` | String | No | None | Free-text search (matches name, description, location) |
  | `status` | String | No | `ACTIVE` | Filter by status (`ACTIVE`, `RESOLVED`, `ALL`) |
  | `page` | Integer | No | `1` | Pagination page number |
  | `limit` | Integer | No | `20` | Results per page (max `50`) |
- **Privacy & PII Redaction Rule**: Browse feeds never expose reporter identity or contact information. Item details include `contactMethod` and `contactValue` only when the reporter provided them for that report.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
          "itemName": "Black Dell XPS 15 Laptop",
          "category": {
            "name": "Electronics",
            "slug": "electronics",
            "iconName": "laptop"
          },
          "reportType": "FOUND",
          "description": "Found inside Lecture Hall 3 on the 4th row.",
          "location": "Science Complex - Lecture Hall 3",
          "dateReported": "2026-11-10T14:30:00.000Z",
          "status": "ACTIVE",
          "imageUrl": "https://pub-blob.vercel-storage.com/campusfind/items/laptop-abc123.jpg",
          "createdAt": "2026-11-11T12:30:00.000Z"
        }
      ]
    },
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

### 3.3 Get Item Report by ID
- **Endpoint**: `GET /api/v1/items/:id`
- **Access**: Public
- **CSRF Required**: No
- **Response (200 OK)**: Returns item details. Includes `contactMethod` (`EMAIL`, `WHATSAPP`, or `PHONE`) and `contactValue` only when the reporter provided them; otherwise contact details remain private.

### 3.4 Mark Item Report Resolved
- **Endpoint**: `PATCH /api/v1/items/:id`
- **Access**: Authenticated (Owner of report or Admin)
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Resolution behavior**: The report owner or an administrator may set an `ACTIVE` or `CLAIM_PENDING` report to `RESOLVED`. Any pending claims are closed as rejected and the claimants are notified.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "item": { ... }
    }
  }
  ```

### 3.5 Archive / Delete Item Report
- **Endpoint**: `DELETE /api/v1/items/:id`
- **Access**: Authenticated (Owner of report or Admin)
- **CSRF Required**: Yes
- **Behavior**: The report is archived and removed from the owner's report list. Pending claims are closed and claimants are notified; report and claim history remain stored.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Item report successfully archived."
    }
  }
  ```

### 3.6 Get Current User's Item Reports
- **Endpoint**: `GET /api/v1/users/me/reports`
- **Access**: Authenticated
- **CSRF Required**: No
- **Note**: Archived reports are omitted.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "reports": [
        {
          "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
          "itemName": "Black Dell XPS 15 Laptop",
          "reportType": "FOUND",
          "status": "ACTIVE",
          "claimsCount": 2,
          "createdAt": "2026-11-11T12:30:00.000Z"
        }
      ]
    }
  }
  ```

---

## 5. User Profile Module

### 5.1 Get Current User's Profile
- **Endpoint**: `GET /api/v1/users/me`
- **Access**: Authenticated
- **CSRF Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
        "email": "jane.doe@university.edu",
        "fullName": "Jane Doe",
        "role": "STUDENT",
        "studentId": null,
        "isEmailVerified": true,
        "isStudentVerified": false,
        "createdAt": "2026-11-11T12:00:00.000Z",
        "updatedAt": "2026-11-11T12:00:00.000Z"
      }
    }
  }
  ```

### 5.2 Update Current User's Profile
- **Endpoint**: `PATCH /api/v1/users/me`
- **Access**: Authenticated
- **CSRF Required**: Yes
- **Permitted Update Fields**:
  - `fullName` — Display name. Validated: minimum 2 characters, maximum 100 characters.
  - `studentId` — Institutional student identifier. Validated: `VARCHAR(50)`, optional.
- **Forbidden Fields (rejected with `403 FORBIDDEN` if present)**:
  - `role` — Role elevation is never permitted via this endpoint.
  - `email` — Email changes are not supported in MVP.
  - `isEmailVerified` / `isStudentVerified` — Verification flags are managed exclusively by backend verification workflows. Students cannot self-certify these fields.
- **Request Body**:
  ```json
  {
    "fullName": "Jane M. Doe",
    "studentId": "STU-20249812"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
        "fullName": "Jane M. Doe",
        "studentId": "STU-20249812",
        "updatedAt": "2026-11-11T15:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` / `VALIDATION_FAILED`: Field violates length or format constraints.
  - `403 Forbidden` / `FORBIDDEN`: Request body contained a protected field (`role`, `isEmailVerified`, etc.).

---

## 6. Claims Module

### 6.1 Submit Ownership Claim
- **Endpoint**: `POST /api/v1/claims`
- **Access**: Authenticated + Verified Email (`isEmailVerified === true`)
- **CSRF Required**: Yes
- **Business Rules**:
  - The target item must have `reportType === 'FOUND'`.
  - The target item must have `status === 'ACTIVE'`.
  - The user cannot file a claim against their own reported item (`claimantId !== item.userId`).
  - A user cannot submit more than one active claim on the same item.
- **Request Body**:
  ```json
  {
    "reportId": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "additionalDetails": "I left this Dell laptop after CS301. The serial number ends in 8912 and there is an Octocat sticker on the right palm rest. My desktop wallpaper is the Grand Canyon."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "claim": {
        "id": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
        "reportId": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
        "status": "PENDING",
        "additionalDetails": "I left this Dell laptop after CS301...",
        "createdAt": "2026-11-11T13:00:00.000Z"
      },
      "message": "Ownership claim submitted successfully. Campus administrators will review your evidence."
    }
  }
  ```

### 6.2 Get Current User's Claims
- **Endpoint**: `GET /api/v1/users/me/claims`
- **Access**: Authenticated
- **CSRF Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "claims": [
        {
          "id": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
          "status": "PENDING",
          "createdAt": "2026-11-11T13:00:00.000Z",
          "decisionNotes": null,
          "resolvedAt": null,
          "report": {
            "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
            "itemName": "Black Dell XPS 15 Laptop",
            "location": "Science Complex - Lecture Hall 3",
            "imageUrl": "https://pub-blob.vercel-storage.com/campusfind/items/laptop-abc123.jpg"
          }
        }
      ]
    }
  }
  ```

### 6.3 Get Claim Details
- **Endpoint**: `GET /api/v1/claims/:id`
- **Access**: Authenticated (Claimant or Admin only)
- **CSRF Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "claim": {
        "id": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
        "status": "PENDING",
        "additionalDetails": "...",
        "decisionNotes": null,
        "resolvedAt": null,
        "createdAt": "2026-11-11T13:00:00.000Z",
        "report": { ... }
      }
    }
  }
  ```

---

## 7. Administrative Moderation Module

All endpoints in this section require `req.session.user.role === 'ADMIN'`.

### 7.1 Admin Dashboard Aggregation Statistics
- **Endpoint**: `GET /api/v1/admin/dashboard-stats`
- **Access**: Admin Only
- **CSRF Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalReports": 128,
        "activeLost": 42,
        "activeFound": 56,
        "pendingClaims": 14,
        "resolvedItems": 68
      }
    }
  }
  ```

### 7.2 List Moderation Claims Queue
- **Endpoint**: `GET /api/v1/admin/claims`
- **Access**: Admin Only
- **CSRF Required**: No
- **Query Parameters**:
  - `status`: `PENDING` (default), `APPROVED`, `REJECTED`, `ALL`
  - `page`: default `1`
  - `limit`: default `20`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "claims": [
        {
          "id": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
          "status": "PENDING",
          "additionalDetails": "Serial number ends in 8912...",
          "createdAt": "2026-11-11T13:00:00.000Z",
          "claimant": {
            "id": "c1f7a4e0-32b4-4b52-9b2f-7c1e5d321001",
            "fullName": "Jane Doe",
            "email": "jane.doe@university.edu"
          },
          "report": {
            "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
            "itemName": "Black Dell XPS 15 Laptop",
            "location": "Science Complex - Lecture Hall 3",
            "dateReported": "2026-11-10T14:30:00.000Z"
          }
        }
      ]
    },
    "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

### 7.3 Review & Resolve Claim (Approve / Reject)
- **Endpoint**: `PATCH /api/v1/admin/claims/:id`
- **Access**: Admin Only
- **CSRF Required**: Yes
- **Business Logic**:
  - If approved:
    1. Sets `Claim.status = 'APPROVED'`.
    2. Sets `Claim.decisionNotes = payload.decisionNotes`.
    3. Sets `Claim.reviewedBy = admin.id` and `resolvedAt = NOW()`.
    4. Sets associated `ItemReport.status = 'RESOLVED'`.
    5. Sets any other pending claims on this item to `'REJECTED'` with system note: *"Item ownership was verified and claimed by another party."*
    6. Automatically dispatches an in-app `Notification` to the claimant.
  - If rejected:
    1. Sets `Claim.status = 'REJECTED'`.
    2. Records `decisionNotes`.
    3. Leaves `ItemReport.status = 'ACTIVE'` if other claims remain or reopens for new claims.
    4. Automatically dispatches an in-app `Notification` to the claimant.
- **Request Body**:
  ```json
  {
    "decision": "APPROVED",
    "decisionNotes": "Serial number 8912 verified against device bios. Item handed over to student at Central Campus Security Desk."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "claim": {
        "id": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
        "status": "APPROVED",
        "decisionNotes": "Serial number 8912 verified against device bios...",
        "reviewedBy": "a0000000-0000-0000-0000-000000000001",
        "resolvedAt": "2026-11-11T14:00:00.000Z"
      },
      "message": "Claim approved successfully."
    }
  }
  ```

### 5.4 Update Item Report Moderation Status
- **Endpoint**: `PATCH /api/v1/admin/reports/:id/status`
- **Access**: Admin Only
- **CSRF Required**: Yes
- **Request Body**:
  ```json
  {
    "status": "ARCHIVED",
    "reason": "Report marked as spam / duplicate."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "item": {
        "id": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
        "status": "ARCHIVED"
      }
    }
  }
  ```

---

## 6. Notifications Module

### 6.1 Get Notifications Feed
- **Endpoint**: `GET /api/v1/notifications`
- **Access**: Authenticated
- **CSRF Required**: No
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `20`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "id": "11223344-5566-7788-99aa-bbccddeeff00",
          "title": "Claim Approved!",
          "message": "Your claim for Black Dell XPS 15 Laptop has been approved. Please collect it at the Central Security Desk.",
          "type": "CLAIM_UPDATE",
          "relatedReportId": "e4b2d1c0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
          "relatedClaimId": "f8a1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
          "isRead": false,
          "createdAt": "2026-11-11T14:00:05.000Z"
        }
      ]
    },
    "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

### 6.2 Get Unread Notification Count
- **Endpoint**: `GET /api/v1/notifications/unread-count`
- **Access**: Authenticated
- **CSRF Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 1
    }
  }
  ```

### 6.3 Mark Notification as Read
- **Endpoint**: `PATCH /api/v1/notifications/:id/read`
- **Access**: Authenticated (Recipient only)
- **CSRF Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "11223344-5566-7788-99aa-bbccddeeff00",
      "isRead": true
    }
  }
  ```

### 6.4 Mark All Notifications as Read
- **Endpoint**: `PATCH /api/v1/notifications/read-all`
- **Access**: Authenticated
- **CSRF Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "updatedCount": 5
    }
  }
  ```

---

## 7. Media Upload Module (Vercel Blob Integration)

Because Vercel serverless containers operate on an ephemeral, read-only filesystem (outside `/tmp`), uploaded item photos are stored in external object storage (**Vercel Blob**).

Local development stores validated photos under `public/uploads/item-photos/`. Production uploads use Vercel Blob and require `BLOB_READ_WRITE_TOKEN`.

### 7.1 Upload Item Photo
- **Endpoint**: `POST /api/v1/uploads`
- **Access**: Authenticated user
- **CSRF Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Validation Rules**:
  - Field name: `file`
  - Max file size: `4 MB` (`4 * 1024 * 1024` bytes), keeping the multipart request below the Vercel Function request-body limit.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - Server validation: MIME magic number inspection (rejecting spoofed file extensions). Only JPEG, PNG, and WebP are accepted.
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "url": "https://pub-blob.vercel-storage.com/campusfind/items/photo-7a8b9c.jpg",
      "contentType": "image/jpeg",
      "size": 1843200
    }
  }
  ```
