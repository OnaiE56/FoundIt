# CampusFind – Vercel Serverless Architecture & Deployment Specification

> **Project:** CampusFind – University Lost and Found Management System  
> **Target Platform:** Vercel (Edge Network + Serverless Functions)  
> **Runtime:** Node.js (v20 / v24 LTS)  
> **Database:** PostgreSQL (Separately hosted managed instance)  
> **Media Storage:** Vercel Blob  
> **Stage:** Project Foundation and Technical Architecture Specification  

---

## 1. Executive Architecture Overview

CampusFind is designed to run in a unified, modern serverless deployment on **Vercel**. Unlike traditional monoliths hosted on continuously running virtual machines (e.g., EC2, VPS), Vercel decouples static frontend asset delivery from backend API compute:

```mermaid
flowchart TD
    Client["Browser / Client (Desktop & Mobile)"]

    subgraph VercelEdge ["Vercel Global Edge Network"]
        StaticCDN["Static Asset CDN\n(public/, generated from frontend/)"]
    end

    subgraph ServerlessCompute ["Vercel Serverless Compute"]
        LambdaBridge["Serverless Handlers\n(api/index.js, api/[...path].js)"]
        ExpressApp["Express.js App\n(backend/app.js)"]
        PrismaClient["Prisma Client v6\n(Global Singleton)"]
    end

    subgraph ExternalServices ["External Managed Cloud Infrastructure"]
        PostgresPooler["PostgreSQL Connection Pooler\n(DATABASE_URL: Transaction Mode)"]
        PostgresDB[("PostgreSQL Database\n(Tables & Prisma Session Store)")]
        VercelBlob[("Vercel Blob Storage\n(Item Images & Receipts)")]
    end

    Client -->|"HTTP GET (HTML, CSS, JS)"| StaticCDN
    Client -->|"HTTP /api/v1/* (REST API)"| LambdaBridge
    LambdaBridge --> ExpressApp
    ExpressApp --> PrismaClient
    PrismaClient -->|"Pooled Connections"| PostgresPooler
    PostgresPooler --> PostgresDB
    ExpressApp -->|"Persist Sessions"| PostgresDB
    ExpressApp -->|"Upload Photos"| VercelBlob
```

---

## 2. Serverless Execution Lifecycle & Constraints

Understanding the serverless execution model is essential for writing correct backend logic:

### 2.1 Ephemeral Container Lifecycles
- **On-Demand Spinup**: When an incoming API request arrives at `/api/*`, Vercel invokes a container instance running the Express handler.
- **Cold Starts**: If no instance is warm, a container boots up (~200ms–600ms latency), initializes module dependencies, and processes the request.
- **Freeze & Termination**: Once the HTTP response is dispatched (`res.json(...)`), the container may be frozen or destroyed at any time.

### 2.2 Prohibited Serverless Patterns
Traditional stateful server patterns **must not be used**:
1. **No In-Memory State**: Global variables or in-memory caches (e.g., `const sessions = {}` or memory-based session stores) are lost across invocations or between concurrent containers.
2. **No Persistent Background Daemons**: `setInterval`, background loops, or unawaited asynchronous operations are paused immediately after the response is sent.
3. **No Local Filesystem Persistence**: The filesystem in a serverless container is **read-only**, with the exception of an ephemeral `/tmp` partition. Files written to `/tmp` are destroyed when the instance shuts down and are never shared across concurrent instances.
4. **No Continuous Port Binding**: `app.listen(port)` must **never** be invoked in serverless mode. Vercel natively binds the exported Express instance to incoming HTTP events.

---

## 3. Express.js Serverless Adaptation

To bridge standard Express.js with Vercel's serverless runtime without code duplication between local development and production, the application is structured with clean separation between application configuration and the execution listener:

### 3.1 Backend Application Definition (`backend/app.js`)
`backend/app.js` configures the Express application, registers security middleware, mounts routes, and exports the `app` instance without binding to a port:

```javascript
// backend/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './utils/prisma.js';
// Route imports...

const app = express();

// Security middleware
app.use(helmet());
if (process.env.ALLOWED_ORIGIN) {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true
  }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prisma-backed persistent session middleware
app.use(session({
  store: new PrismaSessionStore(prisma, {
    dbRecordIdIsSessionId: true,
    sessionModelName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  name: 'cf_session',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    path: '/api',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  }
}));

// API Routes
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/items', itemRouter);
// app.use('/api/v1/claims', claimRouter);

export default app;
```

### 3.2 Vercel Serverless Function Entries
`api/index.js` handles the API base path, while `api/[...path].js` catches nested API paths such as `/api/v1/health`. Both import and export the same configured Express application:

```javascript
// api/index.js
import app from '../backend/app.js';

export default app;
```

### 3.3 Optional Local Development Entry Point (`backend/server.js`)
For standalone local development without the Vercel CLI:
```javascript
// backend/server.js
import app from './app.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[CampusFind] Server running on http://localhost:${PORT}`);
});
```

---

## 4. Vercel Static Assets & Security Headers

Frontend source files stay in `frontend/`. The package install/build step copies them into `public/`; Vercel serves that directory through its static CDN, and the local Express server serves the same files. API routes are matched by Vercel's `api/` function routes, so custom rewrites are not needed. The root `vercel.json` adds baseline response headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 5. PostgreSQL Connection Pooling Architecture

### 5.1 The Serverless Connection Problem
PostgreSQL allocates a dedicated backend worker thread/process for every open client connection. Default configurations typically allow between 50 and 100 simultaneous connections. 

In a serverless environment:
- 100 concurrent incoming requests can instantiate 100 lambda instances.
- If each instance opens its own database connection, the database server immediately rejects incoming connections with `FATAL: remaining connection slots are reserved for non-replication superuser connections`.

### 5.2 Two-Tier Connection Strategy

To prevent connection starvation:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Serverless Lambda Pool      │       │     Prisma CLI Migrations       │
│  (Runtime Express API Handlers) │       │  (Deployment Pipeline / CI/CD)  │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │ Runtime Queries                         │ Migrations & DDL
                 ▼                                         ▼
   DATABASE_URL (Port 6543 / Pooler)             DIRECT_URL (Port 5432 / Direct)
┌─────────────────────────────────┐                        │
│   Connection Pooler (PgBouncer) │                        │
│      [Transaction Pooling]      │                        │
└────────────────┬────────────────┘                        │
                 │                                         │
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database Engine                         │
└───────────────────────────────────────────────────────────────────────────┘
```

1. **Runtime API Queries (`DATABASE_URL`)**:
   - Routes through a **transaction-mode connection pooler**.
   - Connections are held only for the duration of an individual SQL transaction, then instantly returned to the shared pool.
2. **Migrations & CLI Commands (`DIRECT_URL`)**:
   - Connects directly to the native PostgreSQL port (typically `5432`).
   - Required for `prisma migrate deploy`, `prisma db push`, and advisory locks, which cannot operate through transaction poolers.

### 5.3 Provider-Specific Configuration Guidelines
Connection pooling parameters are **provider-specific** and must be configured according to the selected PostgreSQL hosting provider:

- **Supabase**:
  - `DATABASE_URL`: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
  - `DIRECT_URL`: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
- **Neon**:
  - `DATABASE_URL`: `postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require`
  - `DIRECT_URL`: `postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require`
- **AWS RDS with PgBouncer**:
  - `DATABASE_URL`: `postgresql://[user]:[password]@[pgbouncer-host]:6432/[dbname]?pgbouncer=true`
  - `DIRECT_URL`: `postgresql://[user]:[password]@[rds-instance-endpoint]:5432/[dbname]`

### 5.4 Prisma Client Global Singleton Pattern
To prevent warm serverless containers from repeatedly instantiating new `PrismaClient` instances during hot-reloads or container re-invocations, CampusFind employs the global singleton pattern:

```javascript
// backend/utils/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 6. Serverless Session Persistence (Prisma)

Because serverless containers do not share in-memory state:
1. The `@quixo3/prisma-session-store` performs session reads and writes through the shared Prisma `Session` model.
2. The same Prisma model works with local SQLite and future PostgreSQL; the configured `DATABASE_URL` selects the provider-specific database connection.
3. Session expiration is enforced from the stored expiry timestamp. The `IDX_session_expire` index supports cleanup jobs without requiring background intervals inside serverless functions.

---

## 7. Media & File Upload Architecture (Vercel Blob)

Because local disk uploads (`/uploads/*`) are ephemeral on Vercel, item photos are stored in **Vercel Blob** (an S3-backed global CDN object store):

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Finder
    participant Frontend as Browser Client
    participant Express as Serverless API (POST /api/v1/uploads)
    participant Blob as Vercel Blob Cloud
    participant DB as PostgreSQL Database

    User->>Frontend: Selects photo (e.g. laptop.jpg, 2MB)
    Frontend->>Frontend: Checks selected image type and size
    Frontend->>Express: POST /api/v1/uploads (multipart/form-data + X-CSRF-Token)
    Note over Express: Authenticates the session
    Note over Express: Verifies file size <= 4MB & inspects MIME magic bytes
    Express->>Blob: put('campusfind/items/uuid.jpg', fileBuffer, access: 'public')
    Blob-->>Express: Returns public URL (https://pub-blob.vercel-storage.com/...)
    Express-->>Frontend: 201 Created { success: true, data: { url } }
    Frontend->>Express: POST /api/v1/items (includes imageUrl in JSON body)
    Express->>DB: INSERT INTO "ItemReport" (..., imageUrl)
    DB-->>Express: Confirmed
    Express-->>Frontend: 201 Created Item Report
```

### Security Safeguards for Uploads:
1. **Authentication Guard**: Only signed-in users can upload files.
2. **File Size Enforcement**: Strict 4MB file limit enforced while parsing the multipart upload.
3. **MIME Magic Byte Verification**: File headers are inspected to verify genuine JPEG, PNG, or WebP bytes, preventing extension spoofing.
4. **UUID File Renaming**: Original user-supplied filenames are never used on the storage layer, preventing path traversal attacks.

---

## 8. Environment Variables Specification

The following variables must be configured in the Vercel Project Dashboard (under *Settings > Environment Variables*):

| Variable Name | Environment | Purpose / Format | Example Value |
|---|---|---|---|
| `NODE_ENV` | All | Application environment | `production` |
| `DATABASE_URL` | All | Pooled PostgreSQL connection string for Prisma & session store (future deployment) | `postgresql://user:pass@pooler.neon.tech/campusfind?sslmode=require` |
| `DIRECT_URL` | All | Direct PostgreSQL connection string for Prisma CLI migrations | `postgresql://user:pass@ep.neon.tech/campusfind?sslmode=require` |
| `SESSION_SECRET` | Local & production | High-entropy 64-character secret for signing session cookies | Generated with `npm run secret:generate` |
| `ALLOWED_ORIGIN` | Production | Allowed CORS origin (production domain) | `https://campusfind.university.edu` |
| `BLOB_READ_WRITE_TOKEN` | Production | Access token for Vercel Blob cloud storage API | Automatically injected by Vercel Blob integration |
| `ADMIN_INITIAL_EMAIL` | One-time setup | Optional initial administrator email for the Prisma seed | `admin@campusfind.university.edu` |
| `ADMIN_INITIAL_PASSWORD` | One-time setup | Optional initial administrator password; at least 12 characters | Generate a unique password and keep it secret |
| `ADMIN_INITIAL_NAME` | One-time setup | Optional initial administrator display name | `System Administrator` |

---

## 9. Production Deployment Checklist

Prior to launching CampusFind to production on Vercel:

- [ ] **Database Provisioning**: Verify that the PostgreSQL database instance is provisioned with automated backups enabled.
- [ ] **Connection Pooling**: Confirm that the connection pooler is in **Transaction Mode** and handles connection surges gracefully.
- [ ] **Direct URL Verified**: Run `npx prisma migrate deploy` using `DIRECT_URL` to ensure schema tables, enums, and indexes exist.
- [ ] **Initial Admin Seeding**: Run `npm run prisma:seed` to insert default categories and the initial administrator account.
- [ ] **Environment Secrets**: Ensure `SESSION_SECRET` is generated cryptographically and `BLOB_READ_WRITE_TOKEN` is configured.
- [ ] **Domain & SSL**: Verify custom university domain assignment and automatic Let's Encrypt SSL certificate issuance by Vercel.
- [ ] **Health Check**: Perform end-to-end smoke test verifying `/api/v1/items` public read, session cookie issuance on login, and CSRF token validation.
