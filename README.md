# FoundIt

### University Lost and Found Management System

**FoundIt – Find. Report. Reclaim.**

FoundIt is a web-based University Lost and Found Management System designed to help university students report missing belongings, report found items, search for reported items, and submit ownership claims to recover their belongings.

The platform provides a centralized system for managing lost and found reports and allows administrators to review ownership claims.

## Semester Project MVP

The working version includes account registration and login, item browsing and reporting with optional photos, ownership claims, claim review for administrators, and in-app notifications. It uses the existing SQLite database; deployed photo uploads use Vercel Blob.

To keep the project small, email verification, password recovery, and public browsing without an account are not included. New accounts can use the system immediately. Do not use this MVP as a production university service without adding those verification and recovery workflows.

## Objectives

- Provide a centralized lost and found platform for university students.
- Allow students to report lost and found items.
- Enable users to search and filter reported items.
- Allow students to submit ownership claims.
- Enable administrators to review ownership claims.
- Improve the process of recovering lost belongings within the university community.

## User Roles

### 1. Students

Students can:

- Register and log in using email credentials.
- Report lost and found items with a description, category, date, and location.
- Browse and search reported items with category, status, and location filters.
- View item details with a reporter-provided email, WhatsApp, or call option when available.
- Submit ownership claims on found items with proof of ownership.
- Track their personal reports and claims via a student dashboard.
- Receive in-app notifications regarding claim decisions and report updates.

### 2. Administrators

Administrators can:

- Access the administrative dashboard with aggregate system statistics.
- View basic report and claim totals.
- Review submitted ownership claims alongside claimant proof.
- Approve or reject ownership claims.

## Main Features

- **Authentication & Onboarding**: Email/password registration, login, logout, and secure cookie sessions.
- **Lost & Found Reporting**: Categorized reports with date, location, description, and optional email, WhatsApp, or call contact details.
- **Item Photos**: Optional JPEG, PNG, or WebP uploads are attached to reports and shown in item listings.
- **Item Browsing & Search**: Search by keyword with filters for report type and category.
- **Ownership Claim Submission**: A short form for details that help demonstrate ownership.
- **Administrative Moderation**: A small review queue for approving or rejecting ownership claims.
- **Student Dashboard**: Overview of personal active reports, submitted claims, and recent activity.
- **Notification System**: In-app alerts informing students of claim approvals, rejections, and administrative updates.

## Technology Stack

FoundIt utilizes the following technologies:

| Component | Technology | Current Status / Purpose |
|---|---|---|
| **Frontend Markup** | HTML5 | Page structure and semantic layout |
| **Styling** | Custom CSS Design System / Tailwind CSS | Foundation established via CSS tokens in `frontend/css/design-system.css`; Tailwind CSS planned for compilation workflows |
| **Client-Side Logic** | JavaScript (ES Modules) | Client-side routing, state, validation, DOM rendering, and API communication |
| **Backend Runtime** | Node.js (v24 LTS target) | Server-side JavaScript runtime |
| **Backend Framework** | Express.js | REST API routing, middleware, and business logic |
| **Database** | SQLite locally; PostgreSQL for future deployment | Local development uses a Git-ignored SQLite file; production PostgreSQL is deferred |
| **ORM & Migrations** | Prisma (v6) | Type-safe schema definition, database queries, and migrations |
| **Session Store** | `@quixo3/prisma-session-store` | Server-side sessions persisted through Prisma on local SQLite and future PostgreSQL |
| **File / Media Storage**| Local files in development; Vercel Blob in production | Report photos are stored outside the database |
| **Hosting & Deployment**| Vercel | Static frontend hosting and serverless Express API function execution |
| **Version Control** | Git and GitHub | Source control, branching strategy, and team collaboration |

### Database Hosting Note
Local development uses SQLite and does not require a database server. PostgreSQL is the planned production database, hosted separately from Vercel using a managed provider such as Neon. Connection pooling and a separate direct migration URL will be configured when that deployment work begins.

## Architecture Overview

FoundIt follows a client-server architecture adapted for serverless deployment:

1. **Frontend Layer**: Source assets live in `frontend/`. The install/build script copies them into the ignored, generated `public/` directory, which Vercel serves through its CDN; local Express serves the same generated assets.
2. **API Communication**: The frontend interacts with backend REST endpoints under `/api/v1/*`.
3. **Serverless Backend**: The Express application is exported from `backend/app.js` through `api/index.js` and `api/[...path].js`, with `/api/v1/*` requests handled by Vercel Functions.
4. **Session & Security Model**:
   - **Session Authentication**: Server-managed session stored through Prisma in the configured database, referenced via an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie named `cf_session` scoped to `Path=/api`.
   - **CSRF Defense**: A session-bound random token is stored in an `XSRF-TOKEN` cookie and checked on state-changing requests (`POST`, `PATCH`, `DELETE`).
   - **Password Security**: Passwords hashed using `bcrypt` (work factor 12).
5. **Database Access**: Prisma Client v6 uses SQLite locally through `DATABASE_URL`. Future PostgreSQL deployment will use a pooled runtime URL and a separate direct migration URL; provider-specific migrations and data transfer will be required.
6. **Media**: Photo storage is not part of the semester MVP. The schema can store an image URL if external object storage is added later.

## Project Structure

The repository structure separates the working application from its design notes:

```text
FoundIt/
│
├── frontend/                               # [EXISTING] Frontend client assets
│   ├── assets/                             # [EXISTING] Static icons and graphic assets
│   │   ├── icons/                          # [EXISTING] UI icon SVGs
│   │   └── images/                         # [EXISTING] Brand imagery
│   ├── css/                                # [EXISTING] Stylesheets
│   │   └── design-system.css               # [EXISTING] Complete design system tokens and utilities
│   ├── js/                                 # Client-side JavaScript modules
│   │   ├── services/                       # API and student data services
│   │   ├── utils/                          # [EXISTING] Helper utilities
│   │   │   ├── image.util.js               # [EXISTING] Client-side image validation & resizing
│   │   │   ├── sanitizer.util.js           # [EXISTING] HTML escaping & DOM XSS sanitization
│   │   │   └── validator.util.js           # [EXISTING] Form input and format validators
│   │   └── config.js                       # [EXISTING] Frontend environment configuration
│   └── index.html                          # [EXISTING] Main HTML entry point
│
├── backend/                                # [EXISTING] Backend application structure
│   ├── routes/                             # API routes and access checks
│   ├── app.js                              # [EXISTING] Express application and API foundation
│   ├── server.js                           # [EXISTING] Local Node server entry point
│   └── utils/
│       └── prisma.js                       # [EXISTING] Prisma Client singleton
│
├── api/                                    # [EXISTING] Vercel serverless function entry points
│   ├── index.js                            # [EXISTING] API base entry point
│   └── [...path].js                        # [EXISTING] API route catch-all
│
├── public/                                 # [GENERATED] Static frontend copied from frontend/
├── scripts/                                # [EXISTING] Local setup helpers
│   ├── generate-session-secret.mjs         # [EXISTING] Creates a strong session secret
│   └── sync-frontend.mjs                   # [EXISTING] Copies frontend assets into public/
│
├── database/                               # [PLACEHOLDER] Prisma files live under prisma/
│
├── prisma/                                 # [EXISTING] Prisma ORM configuration
│   ├── schema.prisma                       # [EXISTING] Portable schema configured for local SQLite
│   ├── migrations-sqlite/                  # Local SQLite migration history
│   ├── migrations/                         # Preserved PostgreSQL migration history
│   └── seed.js                             # [EXISTING] Categories and optional first admin
├── prisma.config.ts                        # [EXISTING] Prisma CLI and seed configuration
│
├── docs/                                   # [EXISTING] Technical documentation & specifications
│   ├── methodology/                        # [EXISTING]
│   │   └── agile-development-plan.md       # [EXISTING] Sprints, user stories, and methodology
│   ├── requirements/                       # [EXISTING]
│   │   ├── authentication-and-onboarding-specification.md  # [EXISTING] Auth, sessions, CSRF spec
│   │   └── api-contract-specification.md   # [EXISTING] Complete REST API endpoints contract
│   ├── system-design/                      # [EXISTING]
│   │   ├── database-design.md              # [EXISTING] PostgreSQL schema, models, & ERD spec
│   │   ├── vercel-serverless-architecture.md # [EXISTING] Serverless lifecycle, pooling, & storage
│   │   └── CampusFind System Design Infographic.png # [EXISTING] Architecture infographic
│   └── ui-design/                          # [EXISTING]
│       ├── design-system-specification.md  # [EXISTING] Visual guidelines, components, & tokens
│       ├── desktop/                        # [EXISTING] Desktop screen mockups (PNG)
│       ├── mobile/                         # [EXISTING] Mobile screen mockups (PNG)
│       └── *.png                           # [EXISTING] Showcase grids and collections
│
├── tests/                                  # [PLANNED] Automated test suites
│
├── .gitignore                              # [EXISTING] Git ignore rules
├── .nvmrc                                  # [EXISTING] Node.js major version target
├── .env.example                            # [EXISTING] Safe local environment template
├── package.json                            # [EXISTING] Dependencies and development scripts
├── package-lock.json                       # [EXISTING] Reproducible dependency versions
├── README.md                               # [EXISTING] Project documentation and overview
└── vercel.json                             # [EXISTING] Deployment security headers
```

## Development Environment Setup

### Prerequisites

The following tools are required for local development:

1. **Node.js (v24 LTS recommended)** – Provides the JavaScript runtime and npm package manager.
   - Download: https://nodejs.org/

2. **Git** – Used for version control and collaboration.
   - Download: https://git-scm.com/

3. **Code Editor** – Antigravity, VS Code, or any standard development environment.

4. **SQLite** – Used as a local file database. PostgreSQL setup is deferred until deployment preparation.

5. **GitHub Account** – Required for team repository collaboration and pull requests.

### Open the local app on a phone

Use the same command for desktop and mobile preview. Connect the phone and development computer to the same Wi-Fi network, then start the server with:

```bash
npm run dev
```

Open `http://localhost:3000` on the development computer. On the phone, open one of the `http://<address>:3000` network URLs printed in the terminal. If the page does not load, allow Node.js through the computer's firewall on private networks.

### Verify Node.js Installation

Open a terminal or command prompt and run:

```bash
node -v
npm -v
```

Both commands should return active version numbers (e.g., Node `v24.x` and npm `11.x`).

### Install and run locally

From the repository root, install dependencies and create a local environment file:

```bash
npm install
copy .env.example .env
npm run secret:generate
```

Paste the generated value into `SESSION_SECRET` in `.env`. The example already sets `DATABASE_URL=file:./dev.db`; no PostgreSQL server or `DIRECT_URL` is needed locally. `npm run dev` starts the standalone Express server with file watching on port `3000` by default and prints desktop and mobile browser addresses. The `/api/v1/health` endpoint confirms Express is responding; it does not check database connectivity. Session middleware uses the local SQLite database when both `SESSION_SECRET` and `DATABASE_URL` are set.

Apply the schema and starter data with:

```bash
npm run prisma:migrate
npm run prisma:seed
```

The seed creates the standard item categories. It creates the first administrator only when `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` are set in `.env`.

### Backend Dependencies

The package manifest currently includes these core packages:

| Package | Purpose |
|---|---|
| `express` | Web application framework for REST routing and controllers |
| `express-session` | Session middleware for Express |
| `@quixo3/prisma-session-store` | Maintained Prisma-backed store for local SQLite and future PostgreSQL sessions |
| `prisma` & `@prisma/client` | Database ORM, schema generation, and query engine |
| `bcrypt` | Secure password hashing (salted SHA-based key derivation) |
| `zod` | Runtime schema validation for API request bodies and query parameters |
| `helmet` | Security-related HTTP response headers |
| `cors` | Cross-Origin Resource Sharing configuration |
| `@vercel/blob` | Reserved for a future photo upload feature |

### Environment Variables

Sensitive credentials and environment-specific settings must be stored in `.env` files and configured in the Vercel project dashboard. **Never commit actual `.env` files to Git.**

The committed `.env.example` uses a local SQLite file and documents optional first-admin and image-storage settings. `.env` and SQLite database files are ignored by Git. PostgreSQL variables are for the future deployment configuration only:

```env
# Server Runtime
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000

# Session & Security
SESSION_SECRET=replace_with_a_64_character_cryptographically_secure_random_string

# Local SQLite database (resolved relative to prisma.config.ts)
DATABASE_URL="file:./dev.db"

# File / Media Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token_here"
```

For future PostgreSQL deployment, use the provider's pooled `DATABASE_URL` at runtime and a separate direct migration URL. Switching providers requires a PostgreSQL-specific migration history and a deliberate data transfer; SQLite migration files cannot be applied to PostgreSQL.

## Deployment

FoundIt is designed for deployment on Vercel:

1. Push feature branches and pull requests to the GitHub repository.
2. Connect the repository to Vercel for continuous deployment.
3. When deployment is approved, configure PostgreSQL `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`, and `NODE_ENV=production` in Vercel.
4. Generate and review a PostgreSQL-specific migration history, transfer any required local data, and apply migrations using the direct connection URL (`DIRECT_URL`).
5. Vercel serves generated static assets from `public/` and API functions under `api/`.
6. Conduct post-deployment smoke testing against live API endpoints and the frontend UI.

For comprehensive serverless deployment details, consult [`docs/system-design/vercel-serverless-architecture.md`](docs/system-design/vercel-serverless-architecture.md).

## Development Model

FoundIt follows the **Agile Software Development Model**, utilizing iterative sprint cadences:

- Iterative planning, feature backlog grooming, and user story estimation.
- Short, targeted implementation sprints with dedicated pull request reviews.
- Continuous verification and automated regression testing.
- Progressive delivery of features across agreed architectural phases.

Detailed sprint breakdowns and user stories are documented in [`docs/methodology/agile-development-plan.md`](docs/methodology/agile-development-plan.md).

## Project Status

**Current Stage:** **Semester Project MVP**

- [x] Initial problem definition, user research, and functional requirements.
- [x] Agile development roadmap and sprint breakdowns.
- [x] Design system specifications, design tokens, and UI screen mockups.
- [x] Authentication and onboarding specification with session and CSRF architecture.
- [x] Portable relational database design, local SQLite setup, and future PostgreSQL model and ERD specification.
- [x] Complete REST API contract specification.
- [x] Vercel serverless deployment architecture.
- [x] Project setup scaffold, initial Prisma schema/migration, and database seed script.
- [x] Backend registration, login, session protection, reports, claims, notifications, and admin claim review.
- [x] Frontend authentication and student report, browse, claim, profile, and admin review screens.
- [ ] Email verification, password reset, and public guest browsing (deferred to keep the semester scope small).

The requirements documents retain ideas for later versions; the implemented semester MVP is intentionally smaller.

## Contribution Guidelines

Team members must adhere to the following standards:

1. **Branching Strategy**: Branch from `main` using descriptive names (e.g., `feature/auth-endpoints`, `fix/login-csrf`).
2. **Commit Hygiene**: Write atomic, informative commit messages following conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).
3. **Security Discipline**: Never commit secrets, database URLs, `.env` files, or session keys.
4. **Documentation Sync**: Update relevant architectural documents whenever interface or database schema changes occur.
5. **Code Review**: Submit pull requests for peer review prior to merging into `main`.
