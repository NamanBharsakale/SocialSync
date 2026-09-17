<div align="center">

# SocialSync

### AI-Powered Social Media Automation Platform

**Connect all your social accounts, generate AI content, schedule posts, and publish automatically — from one clean dashboard.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-red?style=for-the-badge)](https://social-sync-topaz-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-NamanBharsakale-181717?style=for-the-badge&logo=github)](https://github.com/NamanBharsakale/SocialSync)

![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## Overview

Managing multiple social media accounts is time-consuming and error-prone. SocialSync solves this by giving you a single platform to connect accounts, generate AI-written content, schedule posts, and publish them automatically across LinkedIn, Instagram, Twitter, and more.

> **Deployed at:** [social-sync-topaz-omega.vercel.app](https://social-sync-topaz-omega.vercel.app/)

---

## Features

### Authentication & Security
- **Email / Password Registration & Login** — full sign-up and sign-in flow with JWT-based sessions (30-day expiry)
- **Forgot Password** — secure, time-limited reset link sent to email via Gmail SMTP; link expires in 1 hour
- **Rate-Limited Reset Tokens** — cannot request a new reset link for 60 seconds after the previous one is issued (429 throttle)
- **Host-Header Injection Protection** — reset URLs are built from a trusted `CLIENT_URL` env var, not from the `Origin` header
- **JWT in-memory / localStorage** — token stored securely; all routes guarded by a `protect` middleware that validates the token and checks the user still exists in the database

### Dashboard
- **Unified Activity Feed** — see all recent posts, statuses, and account activity at a glance
- **Connected Accounts Overview** — quick snapshot of every linked social profile
- **Quick Actions** — jump straight to the Scheduler or AI Composer from the dashboard

### Social Account Management
- **OAuth via Zernio** — connect Instagram, LinkedIn, Twitter/X, and other platforms with one click
- **Manual Sync** — instantly refresh your connected accounts list from Zernio with a single button
- **Per-User Isolation** — social accounts are strictly scoped to the logged-in user; no cross-user data leakage
- **Profile Caching** — Zernio profile ID is cached after first fetch to avoid redundant API calls

### Post Scheduler
- **Multi-Platform Scheduling** — select one or more platforms for a single post
- **Date & Time Picker** — pick an exact publish date and time
- **Media Attachments** — upload images or video files; previews rendered with automatic Blob URL cleanup (no memory leaks)
- **Draft & Schedule Modes** — save a post as a draft or queue it for automatic publishing
- **Post Status Tracking** — every post moves through `scheduled → processing → published / failed` states, visible in the UI

### Automated Publishing
- **Node-cron Scheduler** — a background cron job runs every minute to check for posts whose `scheduledFor` time has passed
- **Atomic Claim Pattern** — posts are transitioned to `processing` before publishing begins, preventing double-publishing in concurrent runs
- **Multi-Platform Dispatch** — each post is published to every selected platform via the Zernio API in a single scheduled run
- **Failure Handling** — posts with no connected accounts or failed API calls are marked `failed` (never silently dropped)

### AI Composer
- **Text Generation (Google Gemini)** — enter a topic and select a tone (Professional, Creative, Funny, Minimalist, Excited); Gemini `gemini-2.5-flash` generates a platform-optimized caption with relevant hashtags
- **AI Image Generation (Pollinations AI)** — optionally generate a matching image for the post using Pollinations AI — free, no API key required
- **Cloudinary Storage** — generated images are fetched as a buffer and uploaded to Cloudinary so they're reliably stored and served
- **Generation History** — all past AI generations are saved and displayed in the Recents grid; any generation can be re-scheduled with one click
- **One-Click Schedule** — generated content flows directly into the schedule modal without copy-pasting

### Media Handling
- **Cloudinary Integration** — all uploaded and AI-generated media is stored in Cloudinary and served via CDN
- **Multer Memory Storage** — files are streamed directly to Cloudinary without writing to disk
- **Blob URL Lifecycle** — media previews use `URL.createObjectURL` with `useEffect` cleanup on unmount/change, preventing browser memory leaks

### UI & Responsiveness
- **React 19 + React Compiler** — built on the latest React with the Babel compiler plugin for automatic memoization
- **Tailwind CSS** — fully responsive layout that adapts from mobile to widescreen
- **Framer Motion-ready** — enter/exit animations on page transitions
- **Toast Notifications** — `react-hot-toast` for real-time success and error feedback
- **Lucide React Icons** — consistent, accessible icon set throughout the UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS, React Router v7 |
| Backend | Node.js (LTS), Express 5, TypeScript |
| Database | MongoDB Atlas, Mongoose 9 |
| Authentication | JWT (30-day), bcrypt, HttpOnly-safe tokens |
| Email | Nodemailer + Gmail SMTP (App Password) |
| AI — Text | Google Gemini API (`gemini-2.5-flash`) |
| AI — Image | Pollinations AI (free, URL-based, no key required) |
| Media Storage | Cloudinary (upload_stream) |
| Social OAuth | Zernio API |
| Scheduler | node-cron |
| Testing | Vitest 4, @vitest/coverage-v8 |
| Deployment | Vercel (frontend), MongoDB Atlas (DB) |

---

## Architecture

```
Browser (React 19 + Vite)
         │
         │  HTTPS / REST + JSON
         ▼
  Express 5 API Server (Node.js + TypeScript)
  ┌─────────────────────────────────────────┐
  │  Auth Middleware (JWT verify + DB check) │
  │  Routes → Controllers → Services        │
  └──────┬───────────────┬──────────────────┘
         │               │
    ┌────┴────┐    ┌──────┴──────┐
    │ MongoDB │    │  node-cron  │ ← every minute
    │  Atlas  │    │  Scheduler  │
    └─────────┘    └──────┬──────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         Zernio API   Cloudinary   Gemini /
         (publish)    (media)      Pollinations
```

---

## Project Structure

```
SocialSync/
├── client/                       # React + Vite frontend
│   └── src/
│       ├── api/                  # Axios instance (baseURL from env)
│       ├── assets/               # Platform configs, static assets
│       ├── components/
│       │   ├── Home/             # Landing page sections
│       │   ├── Layout.tsx        # App shell
│       │   └── SideBar.tsx       # Navigation
│       ├── context/
│       │   └── AuthContext.tsx   # JWT state, login/logout
│       ├── pages/
│       │   ├── Home.tsx          # Landing page
│       │   ├── Login.tsx         # Login + Register (toggled)
│       │   ├── Dashboard.tsx     # Activity overview
│       │   ├── Accounts.tsx      # Social account management
│       │   ├── Schedular.tsx     # Post scheduler
│       │   ├── AIComposer.tsx    # AI content + image generator
│       │   └── ResetPassword.tsx # Password reset via token
│       └── App.tsx               # Route tree
│
├── server/                       # Express + TypeScript backend
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection
│   │   ├── cloudinary.ts         # Cloudinary v2 config
│   │   ├── mailer.ts             # Nodemailer (Gmail SMTP)
│   │   ├── multer.ts             # Memory-storage upload
│   │   └── zernio.ts             # Zernio client init
│   ├── controllers/
│   │   ├── authController.ts     # Register, login, forgot/reset password
│   │   ├── postController.ts     # CRUD, AI generation, scheduling
│   │   ├── accountsController.ts # Fetch + sync Zernio accounts
│   │   └── socialAuthController.ts # Zernio OAuth + publish
│   ├── middlewares/
│   │   └── authMiddleware.ts     # JWT protect guard
│   ├── model/
│   │   ├── User.ts               # Users (bcrypt password, reset token)
│   │   ├── Account.ts            # Connected social accounts
│   │   ├── Posts.ts              # Scheduled / published posts
│   │   ├── Generation.ts         # AI generation history
│   │   └── ActivityLog.ts        # Audit / activity feed
│   ├── routes/                   # Express routers
│   ├── services/
│   │   └── scheduleService.ts    # node-cron auto-publish job
│   ├── tests/                    # Vitest unit tests (31 passing)
│   └── server.ts                 # Entry point + global error handler
│
├── docs/                         # Architecture, flow, test report, Q&A
├── screenshots.md                # Visual walkthrough
└── README.md
```

---

## Getting Started (Local)

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas free tier)
- Google Gemini API key — [get one free at ai.google.dev](https://ai.google.dev/)
- Zernio API key — [zernio.com](https://zernio.com)
- Cloudinary account (free tier) — [cloudinary.com](https://cloudinary.com)
- Gmail account with an **App Password** (not your regular password)

### 1. Clone

```bash
git clone https://github.com/NamanBharsakale/SocialSync.git
cd SocialSync
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
MONGODB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_32_char_random_secret

GEMINI_API_KEY=your_google_ai_studio_key
ZERNIO_API_KEY=your_zernio_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password_no_spaces

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords. Paste the 16-character code without spaces.

```bash
npm run server    # starts with nodemon + tsx
```

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Run Tests

```bash
cd server
npm test              # 31 unit tests
npm run test:coverage # with v8 coverage report
```

---

## AI Generation Flow

```
User enters topic + selects tone
            │
            ▼
POST /api/posts/generate
            │
            ▼
Gemini gemini-2.5-flash
  → returns JSON { content, imagePrompt }
            │
            ▼
  [if AI Image enabled]
  fetch buffer from Pollinations AI
  → stream upload to Cloudinary
  → store secure_url as mediaUrl
            │
            ▼
Generation saved to MongoDB
            │
            ▼
Returned to UI → appears in Recents grid
            │
            ▼
User clicks "Schedule Post" → picks platforms + date/time
            │
            ▼
POST /api/posts  (status: "scheduled")
```

---

## Auto-Publish Flow

```
node-cron fires every minute
        │
        ▼
Find posts where scheduledFor ≤ now AND status = "scheduled"
        │
        ▼
Atomically set status = "processing"  (prevents double-publish)
        │
        ▼
For each claimed post:
  → fetch user's connected accounts from MongoDB
  → call Zernio API for each selected platform
  → set status = "published" or "failed"
```

---

## Deployment

| Layer | Platform |
|---|---|
| Frontend | **Vercel** |
| Backend | Render / Railway (any Node.js host) |
| Database | **MongoDB Atlas** |
| Media | **Cloudinary** |

Set the same env vars from the local setup in your hosting platform's environment settings. Set `CLIENT_URL` to your Vercel frontend URL on the backend, and `VITE_API_BASE_URL` to your backend URL on the frontend.

---

## Roadmap

- [x] JWT Authentication (register, login, forgot/reset password)
- [x] Social account connect via Zernio OAuth
- [x] Multi-platform post scheduling
- [x] Automated publishing with node-cron
- [x] AI text generation (Google Gemini)
- [x] AI image generation (Pollinations AI)
- [x] Cloudinary media storage
- [x] Activity logs
- [x] Unit test suite (Vitest — 31 tests)
- [ ] Analytics dashboard
- [ ] Team / multi-user workspace
- [ ] Post performance insights
- [ ] Subscription & billing (Stripe)
- [ ] AI content A/B optimization
- [ ] Browser extension for quick scheduling

---

## License

[MIT](LICENSE)

---

<div align="center">

Built with the MERN stack · Google Gemini · Pollinations AI · Zernio · Cloudinary

If this project helped you, please ⭐ the repository!

</div>
