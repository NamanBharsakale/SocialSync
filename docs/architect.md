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
| GET | `/api/accounts` | Yes | List connected social accounts |
| POST | `/api/accounts/connect` | Yes | Connect a social account via Zernio |
| DELETE | `/api/accounts/:id` | Yes | Disconnect a social account |
| POST | `/api/posts/generate` | Yes | Generate AI text + image |
| GET | `/api/posts/generations` | Yes | Fetch past AI generations |
| POST | `/api/posts` | Yes | Schedule a post (with optional media upload) |
| GET | `/api/posts` | Yes | Fetch all scheduled posts |
| GET | `/api/activity` | Yes | Fetch activity log |
| GET | `/api/oauth/*` | No | Social OAuth callbacks |

---

## Data Models

### User
```
_id, name, email, password (bcrypt), createdAt
```

### Account
```
_id, user, platform, accountId, accessToken, username, profilePicture, createdAt
```

### Generation (AI output)
```
_id, user, prompt, content, imagePrompt, mediaUrl, mediaType, tone, createdAt
```

### Post (scheduled)
```
_id, user, content, platforms[], mediaUrl, mediaType, scheduledFor, status, createdAt
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
| `jsonwebtoken` + `bcrypt` | Auth |
| `@google/genai` | Gemini text generation |
| `cloudinary` | Media CDN storage |
| `multer` | File upload middleware |
| `@zernio/node` | Social media publishing |
| `node-cron` | Post scheduling daemon |

---

## Image Generation — Previous vs Current

| | Previous | Current |
|---|---|---|
| Provider | Leonardo AI | Pollinations AI |
| API Key Required | Yes (paid) | No |
| Integration | REST + polling loop | Single URL fetch |
| Flow | POST → poll GET until COMPLETE → upload | Build URL → Cloudinary uploads directly |
