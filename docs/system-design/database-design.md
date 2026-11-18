# FoundIt – Database Design & Schema Specification

> **Project:** FoundIt – University Lost and Found Management System  
> **Stage:** Project Foundation and Technical Architecture Specification  
> **Database:** SQLite for local development; PostgreSQL (v15+) is the future production target  
> **ORM & Migration Tool:** Prisma ORM (v6)  
> **Status:** Approved Architectural Baseline  

---

## 1. Overview & Architectural Principles

FoundIt currently uses a local **SQLite** database through **Prisma ORM (v6)**. PostgreSQL remains the approved production target for a later deployment phase. The Prisma models and relationships are kept portable where supported; migration histories are provider-specific and kept separate.

The current schema and SQLite migrations are `prisma/schema.prisma` and `prisma/migrations-sqlite/`. The existing PostgreSQL history under `prisma/migrations/` is preserved and is not used by local SQLite commands. A future provider change requires a PostgreSQL-specific client and migration history, plus an explicit data transfer. Prisma does not convert migration SQL between providers automatically.

### Core Database Principles:
1. **Relational Integrity & Foreign Keys**: Prisma relations and referential actions (`CASCADE`, `RESTRICT`, and `SET NULL`) are retained across local SQLite and future PostgreSQL.
2. **Portable Enumerated Values**: Prisma enum fields preserve existing role and status values. SQLite stores them as text and Prisma validates them; PostgreSQL may use native enums in its own migration history.
3. **Portable Timestamps**: Prisma `DateTime` fields are used in the shared schema. SQLite and PostgreSQL map them differently; application code should use UTC values.
4. **Separate Connection Configuration**: Local development uses one SQLite `DATABASE_URL`. Future PostgreSQL deployment will use a pooled runtime URL and a direct migration URL.
5. **Decoupled Session Persistence**: `@quixo3/prisma-session-store` persists server-side sessions through Prisma in a dedicated `Session` table, supporting local SQLite and future PostgreSQL.
6. **Cloud-Hosted Media References**: Binary image files are persisted in external object storage (e.g., Vercel Blob); the database stores only sanitized public URLs (`ItemReport.imageUrl`).

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ ItemReport : "reports"
    User ||--o{ Claim : "submits"
    User ||--o{ Claim : "reviews (admin)"
    User ||--o{ Notification : "receives"
    User ||--o{ VerificationToken : "owns"
    Category ||--o{ ItemReport : "classifies"
    ItemReport ||--o{ Claim : "receives"
    ItemReport ||--o{ Notification : "references"
    Claim ||--o{ Notification : "references"

    User {
        uuid id PK
        string email UK
        string fullName
        string passwordHash
        Role role
        boolean isEmailVerified
        boolean isStudentVerified
        string studentId
        timestamptz createdAt
        timestamptz updatedAt
    }

    VerificationToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        TokenType type
        timestamptz expiresAt
        timestamptz usedAt
        timestamptz createdAt
    }

    Category {
        uuid id PK
        string name UK
        string slug UK
        string iconName
        timestamptz createdAt
    }

    ItemReport {
        uuid id PK
        uuid userId FK
        uuid categoryId FK
        string itemName
        text description
        ReportType reportType
        string location
        timestamptz dateReported
        ItemStatus status
        string imageUrl
        string contactMethod
        string contactValue
        timestamptz createdAt
        timestamptz updatedAt
    }

    Claim {
        uuid id PK
        uuid reportId FK
        uuid claimantId FK
        text additionalDetails
        ClaimStatus status
        text decisionNotes
        uuid reviewedBy FK
        timestamptz resolvedAt
        timestamptz createdAt
        timestamptz updatedAt
    }

    Notification {
        uuid id PK
        uuid userId FK
        string title
        text message
        NotificationType type
        uuid relatedReportId FK
        uuid relatedClaimId FK
        boolean isRead
        timestamptz createdAt
    }

    Session {
        varchar sid PK
        json sess
        timestamptz expire
    }
```

---

## 3. Data Dictionary & Table Definitions

### 3.1 `User` Table
Stores registered students and authorized administrators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Case-insensitive lowercase email address |
| `fullName` | `VARCHAR(100)` | `NOT NULL` | Full display name of the user |
| `passwordHash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt password hash (work factor 12) |
| `role` | `Role` (Enum) | `NOT NULL`, `DEFAULT 'STUDENT'` | Access level: `STUDENT` or `ADMIN` |
| `isEmailVerified`| `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Email ownership verification flag (DEC-006) |
| `isStudentVerified`| `BOOLEAN`| `NOT NULL`, `DEFAULT FALSE` | Institutional student verification flag (DEC-006) |
| `studentId` | `VARCHAR(50)` | `NULLABLE` | Optional university student ID number |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Account creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last profile update timestamp |

### 3.2 `Category` Table
Lookup table for item classification.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Category identifier |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Human-readable name (e.g., "Electronics") |
| `slug` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | URL-safe slug (e.g., "electronics") |
| `iconName` | `VARCHAR(50)` | `NOT NULL` | Identifier for design system SVG icon |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |

### 3.3 `ItemReport` Table
Stores lost belongings reported by students and found items submitted by campus finders.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique report identifier |
| `userId` | `UUID` | `NOT NULL`, `FK -> User(id) ON DELETE RESTRICT` | User who submitted the report |
| `categoryId` | `UUID` | `NOT NULL`, `FK -> Category(id) ON DELETE RESTRICT` | Assigned item category |
| `itemName` | `VARCHAR(120)` | `NOT NULL` | Title / name of the lost or found item |
| `description` | `TEXT` | `NOT NULL` | Detailed physical description |
| `reportType` | `ReportType` (Enum) | `NOT NULL` | `LOST` or `FOUND` |
| `location` | `VARCHAR(150)` | `NOT NULL` | Campus building, room, or landmark |
| `dateReported` | `TIMESTAMPTZ` | `NOT NULL` | Date and time when the item was lost/found |
| `status` | `ItemStatus` (Enum) | `NOT NULL`, `DEFAULT 'ACTIVE'` | `ACTIVE`, `CLAIM_PENDING`, `RESOLVED`, `ARCHIVED`, `REJECTED` |
| `imageUrl` | `VARCHAR(500)` | `NULLABLE` | Cloud-hosted image URL (Vercel Blob) |
| `contactMethod` | `TEXT` | `NULLABLE` | Reporter-provided contact channel: `EMAIL`, `WHATSAPP`, or `PHONE` |
| `contactValue` | `TEXT` | `NULLABLE` | Email address or international phone number shown only on item details |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last update timestamp |

### 3.4 `Claim` Table
Stores ownership claims filed by students against reported found items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique claim identifier |
| `reportId` | `UUID` | `NOT NULL`, `FK -> ItemReport(id) ON DELETE RESTRICT` | Target found item report being claimed |
| `claimantId` | `UUID` | `NOT NULL`, `FK -> User(id) ON DELETE RESTRICT` | Student submitting the ownership claim |
| `additionalDetails`| `TEXT` | `NOT NULL` | Proof of ownership, distinguishing marks, serial numbers |
| `status` | `ClaimStatus` (Enum) | `NOT NULL`, `DEFAULT 'PENDING'` | `PENDING`, `APPROVED`, `REJECTED` |
| `decisionNotes` | `TEXT` | `NULLABLE` | Explanation or handover instructions from admin |
| `reviewedBy` | `UUID` | `NULLABLE`, `FK -> User(id) ON DELETE SET NULL` | Administrator who resolved the claim |
| `resolvedAt` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when the claim was approved or rejected |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Claim submission timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last status update timestamp |

### 3.5 `Notification` Table
Stores system notifications and claim decision alerts delivered to users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique notification identifier |
| `userId` | `UUID` | `NOT NULL`, `FK -> User(id) ON DELETE CASCADE` | Recipient user |
| `title` | `VARCHAR(150)` | `NOT NULL` | Notification headline |
| `message` | `TEXT` | `NOT NULL` | Notification body text |
| `type` | `NotificationType` (Enum) | `NOT NULL` | `CLAIM_UPDATE`, `REPORT_MATCH`, `SYSTEM` |
| `relatedReportId` | `UUID` | `NULLABLE`, `FK -> ItemReport(id) ON DELETE SET NULL` | Referenced report |
| `relatedClaimId` | `UUID` | `NULLABLE`, `FK -> Claim(id) ON DELETE SET NULL` | Referenced claim |
| `isRead` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Read / unread status indicator |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Notification delivery timestamp |

### 3.6 `Session` Table (Prisma Session Store)
Stores server-side session data for Express authentication. Prisma uses the fields `id`, `sid`, `data`, and `expiresAt` expected by the session store; `data` and `expiresAt` map to the database column names `sess` and `expire`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Prisma session-store record identifier |
| `sid` | `TEXT` | `UNIQUE`, `NOT NULL` | Express session identifier |
| `sess` | `TEXT` | `NOT NULL` | Serialized session object (userId, role, csrfToken) |
| `expire` | `NUMERIC` locally; timestamp in PostgreSQL | `NOT NULL` | Absolute session expiration timestamp |

### 3.7 `VerificationToken` Table
Stores hashed single-use tokens for email address verification and password reset workflows.

Tokens are **never stored in plaintext**. The backend generates a cryptographically secure random value (`crypto.randomBytes(32).toString('hex')`), dispatches the raw value to the user (via email link), and persists only its `SHA-256` hash in this table. On submission, the backend hashes the received token and compares against the stored hash using constant-time comparison.

Tokens are invalidated by:
1. **Expiration**: `expiresAt` is checked before acceptance. Password reset tokens expire after 15 minutes; email verification tokens expire after 24 hours.
2. **Single-use consumption**: `usedAt` is set at the moment a token is accepted. Any subsequent submission of the same raw token value will find `usedAt IS NOT NULL` and reject the request.
3. **Type enforcement**: A `RESET` token cannot satisfy a `VERIFY` check and vice versa. The backend always filters by both `tokenHash` and `type`.
4. **Password-change invalidation**: Password reset tokens embed the user's current `passwordHash` in the signed HMAC check (see implementation note below), so an already-consumed reset token cannot be replayed to change the password a second time.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique token record identifier |
| `userId` | `UUID` | `NOT NULL`, `FK -> User(id) ON DELETE CASCADE` | Owner of this token |
| `tokenHash` | `VARCHAR(64)` | `NOT NULL`, `UNIQUE` | SHA-256 hex digest of the raw token value |
| `type` | `TokenType` (Enum) | `NOT NULL` | `RESET` (password reset) or `VERIFY` (email verification) |
| `expiresAt` | `TIMESTAMPTZ` | `NOT NULL` | Absolute expiration timestamp (enforced at application layer) |
| `usedAt` | `TIMESTAMPTZ` | `NULLABLE` | Set when token is consumed; `NOT NULL` means token is spent |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |

**Implementation Note — Token Generation Pattern:**
```
rawToken  = crypto.randomBytes(32).toString('hex')   // 64-character hex string sent in email URL
tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')   // stored in DB
```

**Validation Constraints:**
- Accept token only if: `type = <expected>` AND `expiresAt > NOW()` AND `usedAt IS NULL`.
- After acceptance: `UPDATE VerificationToken SET usedAt = NOW() WHERE id = <id>` in the same transaction as the main effect (mark email verified / update password hash).
- Stale token cleanup: Expired unconsumed tokens (`expiresAt < NOW()` and `usedAt IS NULL`) may be purged periodically by an external scheduled process — identical to the session pruning approach.

---

## 4. Enumerated Types (PostgreSQL Enums)

The following native PostgreSQL enums are created via Prisma:

```sql
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

CREATE TYPE "TokenType" AS ENUM ('RESET', 'VERIFY');

CREATE TYPE "ReportType" AS ENUM ('LOST', 'FOUND');

CREATE TYPE "ItemStatus" AS ENUM (
    'ACTIVE',
    'CLAIM_PENDING',
    'RESOLVED',
    'ARCHIVED',
    'REJECTED'
);

CREATE TYPE "ClaimStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE "NotificationType" AS ENUM (
    'CLAIM_UPDATE',
    'REPORT_MATCH',
    'SYSTEM'
);
```

---

## 5. Indexing & Performance Strategy

To ensure sub-100ms response times on search queries, dashboard aggregations, and session lookups, the following indexes are specified:

### 5.1 Primary and Unique Indexes
- `User.email` – Unique B-tree index (case-insensitive via lowercase normalization on write).
- `Category.name` and `Category.slug` – Unique B-tree indexes.
- `Session.sid` – Primary key index.
- `VerificationToken.tokenHash` – Unique B-tree index enabling O(1) lookup and preventing duplicate token hash collisions.

### 5.2 Foreign Key B-Tree Indexes
- `ItemReport.userId` – Speeds up `GET /api/v1/users/me/reports`.
- `ItemReport.categoryId` – Speeds up category filtering.
- `Claim.reportId` – Speeds up claims lookup by report.
- `Claim.claimantId` – Speeds up `GET /api/v1/users/me/claims`.
- `Claim.reviewedBy` – Tracks administrative moderation history.
- `Notification.userId` – Speeds up user notification feed retrieval.
- `VerificationToken.userId` – Speeds up token lookup and cleanup by user.

### 5.3 Composite and Filtering Indexes
- `ItemReport (status, reportType, createdAt DESC)` – Composite index optimizing the primary browse and search query (`WHERE status = 'ACTIVE' AND reportType = ? ORDER BY createdAt DESC`).
- `Claim (reportId, status)` – Enforces single pending claim rules and simplifies status checks.
- `Notification (userId, isRead, createdAt DESC)` – Optimizes unread notification counts and navbar badges.
- `Session (expire)` – Named `"IDX_session_expire"`; supports filtering and cleanup of expired server-side sessions.
- `VerificationToken (userId, type, expiresAt)` – Composite index for filtering unexpired, unspent tokens per user per type.

### 5.4 Full-Text Search Strategy
FoundIt supports keyword search across item names, descriptions, and campus locations. The PostgreSQL `tsvector`/GIN index below is a future provider-specific optimization and is intentionally absent from the local SQLite migration history:

```sql
-- PostgreSQL Full-Text Search Index on ItemReport
CREATE INDEX idx_item_report_search ON "ItemReport" 
USING GIN (to_tsvector('english', "itemName" || ' ' || "description" || ' ' || "location"));
```

---

## 6. Prisma ORM (v6) Schema Specification

The executable `prisma/schema.prisma` currently targets SQLite. The PostgreSQL configuration below is retained as a future production reference; do not apply the PostgreSQL migration history to SQLite or vice versa.

```prisma
// FoundIt Database Schema - Prisma v6
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STUDENT
  ADMIN
}

enum TokenType {
  RESET
  VERIFY
}

enum ReportType {
  LOST
  FOUND
}

enum ItemStatus {
  ACTIVE
  CLAIM_PENDING
  RESOLVED
  ARCHIVED
  REJECTED
}

enum ClaimStatus {
  PENDING
  APPROVED
  REJECTED
}

enum NotificationType {
  CLAIM_UPDATE
  REPORT_MATCH
  SYSTEM
}

model User {
  id                String              @id @default(uuid()) @db.Uuid
  email             String              @unique @db.VarChar(255)
  fullName          String              @db.VarChar(100)
  passwordHash      String              @db.VarChar(255)
  role              Role                @default(STUDENT)
  isEmailVerified   Boolean             @default(false)
  isStudentVerified Boolean             @default(false)
  studentId         String?             @db.VarChar(50)
  createdAt         DateTime            @default(now()) @db.Timestamptz
  updatedAt         DateTime            @updatedAt @db.Timestamptz

  reports            ItemReport[]
  claims             Claim[]            @relation("ClaimantUser")
  reviewedClaims     Claim[]            @relation("AdminReviewer")
  notifications      Notification[]
  verificationTokens VerificationToken[]

  @@index([email])
}

model VerificationToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  tokenHash String    @unique @db.VarChar(64)
  type      TokenType
  expiresAt DateTime  @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  createdAt DateTime  @default(now()) @db.Timestamptz

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, type, expiresAt])
}

model Category {
  id        String       @id @default(uuid()) @db.Uuid
  name      String       @unique @db.VarChar(50)
  slug      String       @unique @db.VarChar(50)
  iconName  String       @db.VarChar(50)
  createdAt DateTime     @default(now()) @db.Timestamptz

  reports   ItemReport[]
}

model ItemReport {
  id           String         @id @default(uuid()) @db.Uuid
  userId       String         @db.Uuid
  categoryId   String         @db.Uuid
  itemName     String         @db.VarChar(120)
  description  String         @db.Text
  reportType   ReportType
  location     String         @db.VarChar(150)
  dateReported DateTime       @db.Timestamptz
  status       ItemStatus     @default(ACTIVE)
  imageUrl     String?        @db.VarChar(500)
  contactMethod String?
  contactValue  String?
  createdAt    DateTime       @default(now()) @db.Timestamptz
  updatedAt    DateTime       @updatedAt @db.Timestamptz

  user         User           @relation(fields: [userId], references: [id], onDelete: Restrict)
  category     Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  claims       Claim[]
  notifications Notification[]

  @@index([userId])
  @@index([categoryId])
  @@index([status, reportType, createdAt(sort: Desc)])
}

model Claim {
  id                String         @id @default(uuid()) @db.Uuid
  reportId          String         @db.Uuid
  claimantId        String         @db.Uuid
  additionalDetails String         @db.Text
  status            ClaimStatus    @default(PENDING)
  decisionNotes     String?        @db.Text
  reviewedBy        String?        @db.Uuid
  resolvedAt        DateTime?      @db.Timestamptz
  createdAt         DateTime       @default(now()) @db.Timestamptz
  updatedAt         DateTime       @updatedAt @db.Timestamptz

  report            ItemReport     @relation(fields: [reportId], references: [id], onDelete: Restrict)
  claimant          User           @relation("ClaimantUser", fields: [claimantId], references: [id], onDelete: Restrict)
  reviewer          User?          @relation("AdminReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)
  notifications     Notification[]

  @@index([reportId, status])
  @@index([claimantId])
  @@index([reviewedBy])
}

model Notification {
  id              String           @id @default(uuid()) @db.Uuid
  userId          String           @db.Uuid
  title           String           @db.VarChar(150)
  message         String           @db.Text
  type            NotificationType
  relatedReportId String?          @db.Uuid
  relatedClaimId  String?          @db.Uuid
  isRead          Boolean          @default(false)
  createdAt       DateTime         @default(now()) @db.Timestamptz

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  relatedReport   ItemReport?      @relation(fields: [relatedReportId], references: [id], onDelete: SetNull)
  relatedClaim    Claim?           @relation(fields: [relatedClaimId], references: [id], onDelete: SetNull)

  @@index([userId, isRead, createdAt(sort: Desc)])
}

model Session {
  id        String   @id
  sid       String   @unique
  data      String   @map("sess")
  expiresAt DateTime @map("expire")

  @@index([expiresAt], map: "IDX_session_expire")
}
```

---

## 7. PostgreSQL Connection Architecture in Serverless

### 7.1 Separation of `DATABASE_URL` and `DIRECT_URL`
Because FoundIt deploys backend functions on Vercel's serverless infrastructure, each function execution can spawn a new process. Without connection pooling, a sudden surge of requests could instantly exhaust PostgreSQL's `max_connections` limit.

Prisma v6 addresses this via a two-tier connection pattern:

1. **`DATABASE_URL` (Pooled Connection)**:
   - Configured for the runtime application (`PrismaClient`).
   - Routes through a connection pooler operating in **transaction pooling mode** (e.g., PgBouncer, Neon Connection Pooler, or Supabase Pooler).
   - Allows hundreds of concurrent serverless instances to share a modest pool of physical database connections.

2. **`DIRECT_URL` (Direct Connection)**:
   - Configured for Prisma CLI commands (`prisma migrate dev`, `prisma migrate deploy`, `prisma db push`).
   - Connects directly to PostgreSQL port `5432` without passing through transaction-level pooling.
   - Required because schema migrations and advisory locks rely on session-level PostgreSQL features that are incompatible with transaction-mode poolers.

### 7.2 Provider-Specific Connection Formatting
Connection string parameters differ across hosting providers and must not be assumed to be identical:

- **Supabase**:
  - Pooled: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
  - Direct: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
- **Neon**:
  - Pooled: `postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require`
  - Direct: `postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require`
- **Self-Hosted / AWS RDS (with PgBouncer)**:
  - Pooled: `postgresql://[user]:[password]@[pgbouncer-host]:6432/[dbname]?pgbouncer=true`
  - Direct: `postgresql://[user]:[password]@[rds-host]:5432/[dbname]`

---

## 8. Database Seeding Strategy

Database seeding is executed via a dedicated script (`npm run prisma:seed`) during environment provisioning:

### 8.1 Default Categories
The seed script inserts standard categories required by the UI:
1. `Electronics` (`electronics`, icon: `laptop`)
2. `Keys & ID Cards` (`keys-cards`, icon: `key`)
3. `Books & Notebooks` (`books-stationery`, icon: `book-open`)
4. `Bags & Backpacks` (`bags-backpacks`, icon: `briefcase`)
5. `Clothing & Accessories` (`clothing`, icon: `shirt`)
6. `Water Bottles` (`bottles`, icon: `coffee`)
7. `Other Items` (`other`, icon: `archive`)

### 8.2 Initial Administrator Account Provisioning (DEC-007)
In accordance with DEC-007, administrator accounts are **never provisioned via public registration forms**. The seed script reads environment variables to securely bootstrap the initial system administrator:

```bash
# Seed environment inputs
ADMIN_INITIAL_EMAIL="admin@campusfind.university.edu"
ADMIN_INITIAL_PASSWORD="SecureGeneratedPassword123!"
ADMIN_INITIAL_NAME="System Administrator"
```

The seed script verifies whether an account with `ADMIN_INITIAL_EMAIL` exists:
- If absent, it hashes the password with `bcrypt` (cost 12), sets `role = 'ADMIN'`, `isEmailVerified = true`, `isStudentVerified = true`, and creates the initial administrator.
- If already present, it exits gracefully without altering existing credentials.
