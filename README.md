# SocialSync

AI-powered social media automation platform for scheduling, AI content generation, account management, and automated publishing.

## 1. Overview

SocialSync is a full-stack TypeScript application that helps users:

- manage social media accounts
- generate AI-written content
- generate or attach media
- schedule posts for future delivery
- publish posts through a connected social publishing workflow
- review account activity and recent generations

The system is intentionally designed around a minimal AWS architecture:

- EC2 for the application runtime
- RDS PostgreSQL for relational data
- S3 for media storage
- IAM for least-privilege access control

This project does not use any additional AWS managed services beyond those four core services.

---

## 2. Business Goal

The product is a social content automation dashboard that combines:

- user authentication and authorization
- AI content generation
- media handling
- scheduling logic
- external social publishing integration

The aim is to provide a single place where a user can create content and publish it to multiple connected social accounts without juggling different tools.

---

## 3. System Architecture

```mermaid
flowchart TD
    U[User Browser]
    FE[React Frontend\nclient/src\nVite + TypeScript]
    NGINX[Nginx Reverse Proxy\nEC2]
    API[Express API\nserver/server.ts\nRoutes + Middleware]
    AUTH[Auth Middleware\nJWT validation + user lookup]
    CTRL[Controllers\nauthController\nsocialAuthController\naccountControllers\npostController\nactivityController]
    PRISMA[Prisma ORM\nserver/prisma/schema.prisma]
    RDS[(AWS RDS PostgreSQL\nUser, Account, Post, Generation, ActivityLog)]
    S3[(AWS S3 Bucket\nUpload storage + media assets)]
    IAM[IAM Role / Instance Profile\nleast-privilege access]
    SCH[Scheduler Service\nnode-cron\nserver/services/scheduleService.ts]
    Z[Zernio Social API\nsocial publishing]
    GEM[Google Gemini\nAI text generation]
    IMG[Pollinations AI\nAI image generation]
    SMTP[Gmail SMTP\nNodemailer]

    U --> FE
    FE -->|HTTPS / REST API| NGINX
    NGINX --> API
    API --> AUTH
    AUTH --> CTRL
    CTRL --> PRISMA
    PRISMA --> RDS
    CTRL -->|upload / signed URL| S3
    API -->|publishing requests| Z
    API -->|content generation| GEM
    API -->|image generation| IMG
    API -->|password reset email| SMTP

    EC2[EC2 Instance\nNode.js + Express + PM2]
    NGINX --> EC2
    API --> EC2
    EC2 --> IAM
    IAM --> S3
    EC2 --> RDS

    SCH -->|checks scheduled posts| RDS
    SCH -->|publishes ready posts| Z
```

### Architecture notes

- The frontend is a React single-page app delivered to the browser.
- The backend runs on EC2 behind NGINX and is the central application server.
- Database data is persisted in PostgreSQL on RDS.
- Uploaded and generated media are stored in S3.
- The application uses IAM roles attached to EC2 for restricted AWS access.
- AI-powered content creation depends on external non-AWS services such as Gemini and Pollinations.
- Social publishing depends on the Zernio API.
- Scheduled publishing is processed in the background by the cron-based scheduler.

---

## 4. Full Component Inventory

### Frontend

Location: `client/`

Main responsibilities:

- user authentication pages
- dashboard and account overview
- AI content composer
- scheduling UI
- platform account connection flow

Key files:

- `client/src/App.tsx`
- `client/src/context/AuthContext.tsx`
- `client/src/api/axios.ts`
- `client/src/pages/*`
- `client/src/components/*`

### Backend API

Location: `server/`

Main responsibilities:

- express server bootstrapping
- auth and JWT validation
- social account sync
- content generation
- scheduling management
- post publishing and activity tracking

Key files:

- `server/server.ts`
- `server/routes/authRoutes.ts`
- `server/routes/socialAuthRoutes.ts`
- `server/routes/accountRoutes.ts`
- `server/routes/postRoutes.ts`
- `server/routes/activityRoutes.ts`
- `server/middlewares/authMiddleware.ts`

### Controller Layer

- `server/controllers/authController.ts`
- `server/controllers/socialAuthController.ts`
- `server/controllers/accountControllers.ts`
- `server/controllers/postController.ts`
- `server/controllers/activityController.ts`

Responsibilities:

- sign up / login
- password reset
- OAuth URL generation
- account sync from social providers
- AI content generation
- post scheduling and retrieval
- activity logging

### Data Layer

Location: `server/prisma/schema.prisma`

Core models:

- `User`
- `Account`
- `Post`
- `Generation`
- `ActivityLog`

Key relationships:

- one user has many accounts
- one user has many posts
- one user has many generations
- one user has many activity logs
- posts can reference activity logs

### Scheduler

Location: `server/services/scheduleService.ts`

Responsibilities:

- look up scheduled posts whose time has arrived
- mark them as processing to avoid duplicates
- find connected social accounts for that user and platform
- generate temporary S3 URLs where required
- publish to the social API
- update status to published or failed
- create activity logs

### Storage and AWS

Location: `server/config/*`

- `server/config/prisma.ts` — Prisma database setup
- `server/config/s3.ts` — AWS S3 client initialization
- `server/config/s3Url.ts` — signed URL generation
- `server/config/multer.ts` — file upload handling

### External Services

- Zernio: social account auth and publishing workflow
- Google Gemini: AI text generation
- Pollinations AI: AI image generation
- Gmail SMTP via Nodemailer: password reset emails

---

## 5. AWS-Only Infrastructure Scope

The project targets exactly this AWS footprint:

| AWS component | Purpose |
|---|---|
| EC2 | runs the backend and serves the app runtime |
| RDS PostgreSQL | stores users, posts, accounts, generations, logs |
| S3 | stores uploads, generated media, and object assets |
| IAM | gives EC2 the minimal runtime permissions |

This is the supported production infrastructure model for the application.

---

## 6. Runtime and Data Flow

### Authentication flow

1. User logs in from the frontend.
2. The API validates credentials with bcrypt.
3. JWT is generated and returned to the client.
4. Protected routes use `protect` middleware to verify the header.
5. The user is read from PostgreSQL and attached to the request.

### AI generation flow

1. User submits a prompt and selected options in the UI.
2. API calls the Gemini model to generate content.
3. If image generation is enabled, the backend calls Pollinations AI.
4. Generated assets and content are stored to the database and optionally to S3.
5. The UI displays the generated result for review and scheduling.

### Scheduling flow

1. User creates or edits a post and specifies a future date/time.
2. The API stores the scheduled post in RDS.
3. The scheduler polls for ready posts.
4. When due, the app resolves connected accounts and publishes to the target platform through Zernio.
5. Post status is updated to published or failed.
6. Activity logs are created for auditability.

### Media flow

1. Media is uploaded via multipart form to the backend.
2. The upload is processed and stored in S3.
3. Temporary signed URLs are generated when publishing requires a downloadable or public link.
4. The media metadata is persisted in the database alongside the post record.

---

## 7. Database Model Summary

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : owns
    USER ||--o{ POST : creates
    USER ||--o{ GENERATION : creates
    USER ||--o{ ACTIVITYLOG : logs
    POST ||--o{ ACTIVITYLOG : related

    USER {
        uuid id
        string email
        string password
        string name
        string zernioProfileId
        string resetPasswordToken
        datetime resetPasswordExpires
        datetime createdAt
        datetime updatedAt
    }

    ACCOUNT {
        uuid id
        uuid userId
        enum platform
        string handle
        string zernioAccountId
        string accessToken
        string refreshToken
        datetime tokenExpiresAt
        enum status
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    POST {
        uuid id
        uuid userId
        string content
        string mediaUrl
        enum mediaType
        enum[] platforms
        datetime scheduledFor
        enum status
        datetime createdAt
        datetime updatedAt
    }

    GENERATION {
        uuid id
        uuid userId
        string prompt
        string content
        string mediaUrl
        enum mediaType
        string tone
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITYLOG {
        uuid id
        uuid userId
        enum actionType
        string description
        uuid relatedPostId
        string platform
        string aiGeneratedText
        datetime createdAt
        datetime updatedAt
    }
```

---

## 8. Security Model

The application includes the following core protections:

- JWT authentication for protected routes
- password hashing with bcrypt
- reset tokens hashed before storage
- rate limiting on authentication routes
- API error responses are sanitized in production
- EC2 IAM role restricts AWS access to required resources
- S3 is used for media rather than storing binary assets directly inside the app server

---

## 9. Local Development Guide

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS account for deployment only
- Google Gemini API key
- Zernio API key
- SMTP Gmail credentials for email delivery

### Backend environment

```env
PORT=3000
DATABASE_URL=postgresql://username:password@host:5432/socialsync
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_google_ai_key
ZERNIO_API_KEY=your_zernio_key

AWS_REGION=us-east-1
S3_BUCKET_NAME=socialsync-media

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend environment

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Run locally

```bash
cd server
npm install
npx prisma generate
npm run server
```

```bash
cd client
npm install
npm run dev
```

---

## 10. Project Structure

```text
SocialSync/
├── client/                     # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
│
├── server/                     # Express + TypeScript backend
│   ├── config/
│   ├── controllers/
│   ├── generated/
│   ├── middlewares/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── architect.md
│   ├── deployment.md
│   └── flow.md
├── README.md
├── package.json
└── .gitignore
```

---

## 11. Summary

SocialSync is a practical social media automation system built with a simple and intentional architecture:

- browser-based React frontend
- Node.js + Express backend on EC2
- PostgreSQL on RDS for persistence
- S3 for media storage
- IAM for controlled access
- external AI and social publishing services for generation and delivery

This design keeps the system easy to deploy, easy to reason about, and aligned with the AWS-only target scope requested for the project.
