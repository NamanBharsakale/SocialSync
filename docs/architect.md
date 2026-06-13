# SocialSync — System Architecture

## Overview

SocialSync is a MERN-stack AI social media automation platform. Users connect their social accounts, generate AI content (text + image), schedule posts, and publish automatically via Zernio API.

---

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│              Client (React)             │
│  Vite · React Router · Tailwind CSS     │
│  Axios · AuthContext · JWT localStorage │
└──────────────────┬──────────────────────┘
                   │ HTTP (REST)
                   ▼
┌─────────────────────────────────────────┐
│          Backend (Express + TS)         │
│  Routes → Middleware → Controllers      │
│  Services (scheduler) · Config          │
└────┬──────────┬──────────┬─────────────┘
     │          │          │
     ▼          ▼          ▼
 MongoDB    Cloudinary   Third-Party APIs
 (Atlas)    (media CDN)  Gemini · Pollinations · Zernio
```

---

## Directory Structure

```
SocialSync/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios instance + interceptors
│       ├── components/      # Shared UI (Layout, Sidebar, Modals)
│       │   └── Home/        # Landing page sections
│       ├── context/         # AuthContext (JWT state)
│       ├── pages/           # Route-level page components
│       └── App.tsx          # Router setup
│
├── server/                  # Express backend
│   ├── config/              # DB, Cloudinary, Multer, Zernio setup
│   ├── controllers/         # Business logic per domain
│   ├── middlewares/         # JWT auth guard
│   ├── model/               # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── services/            # node-cron scheduler
│   └── server.ts            # Entry point
│
└── docs/                    # Project documentation
```

---

## Backend API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, receive JWT |
| POST | `/api/auth/forgot-password` | No | Send password-reset email (Gmail SMTP) |
| POST | `/api/auth/reset-password/:token` | No | Consume reset token, update password |
| GET | `/api/accounts` | Yes | List connected social accounts |
| POST | `/api/accounts` | Yes | Add a social account directly |
| DELETE | `/api/accounts/:id` | Yes | Disconnect a social account |
| POST | `/api/posts/generate` | Yes | Generate AI text + image |
| GET | `/api/posts/generations` | Yes | Fetch past AI generations |
| POST | `/api/posts` | Yes | Schedule a post (with optional media upload) |
| GET | `/api/posts` | Yes | Fetch all scheduled posts |
| GET | `/api/activity` | Yes | Fetch activity log |
| GET | `/api/oauth/:platform/url` | Yes | Get Zernio OAuth authorization URL |
| GET | `/api/oauth/sync` | Yes | Pull connected accounts from Zernio into DB |

---

## Data Models

### User
```
_id, name, email, password (bcrypt),
resetPasswordToken (sha256 hash, optional),
resetPasswordExpires (Date, optional),
zernioProfileId (optional), createdAt
```

### Account
```
_id, user, platform (enum: twitter/linkedin/facebook/instagram/...),
zernioAccountId, handle, avatarUrl,
accessToken, refreshToken, tokenExpiresAt,
status (connected/disconnected), createdAt
```

### Generation (AI output)
```
_id, user, prompt, content, imagePrompt, mediaUrl, mediaType, tone, createdAt
```

### Post (scheduled)
```
_id, user, content, platforms[] (enum array), mediaUrl, mediaType,
scheduledFor (Date, required), status (draft/scheduled/published/failed), createdAt
```

### ActivityLog
```
_id, user, action, platform, status, createdAt
```

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` + `bcrypt` | Auth (JWT sign/verify, password hashing) |
| `nodemailer` | Transactional email (password reset via Gmail SMTP) |
| `@google/genai` | Gemini text generation |
| `cloudinary` | Media CDN storage |
| `multer` | File upload middleware (memory storage) |
| `@zernio/node` | Social media OAuth + publishing |
| `node-cron` | Per-second scheduler daemon |

---

## Account Isolation — Security Design

Each user gets their own Zernio profile. The profile ID is stored on the User document and reused on every request — `getOrCreateZernioProfile()` only calls `zernio.profiles.createProfile()` when no ID is stored. It never calls `listProfiles()` (which returns all profiles under the shared API key and would hand one user another's profile).

The `syncsAccounts` upsert filter is `{ zernioAccountId, user: req.user._id }`. This means:
- A new account is created only under the requesting user.
- An existing account belonging to a different user is never matched or overwritten.
- `getAccounts` (used by the frontend) queries `{ user: req.user._id }` — each user sees only their own.

---

## AIComposer Schedule Modal

The modal is controlled by `activeSchedular` state (null = closed, any generation object = open). Closing triggers:
- Success after scheduling: `setActiveSchedular(null)` in the success path of `handleSchedule`
- Backdrop click: `onClick` on the outer overlay div calls `setActiveSchedular(null)`
- ✕ button: same setter

The inner modal card has `e.stopPropagation()` so clicks inside don't bubble to the backdrop.

---

## Image Generation — Previous vs Current

| | Previous | Current |
|---|---|---|
| Provider | Leonardo AI | Pollinations AI |
| API Key Required | Yes (paid) | No |
| Integration | REST + polling loop | Single URL fetch |
| Flow | POST → poll GET until COMPLETE → upload | Build URL → Cloudinary uploads directly |
