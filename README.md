<div align="center">

# 🚀 SocialSync

### AI-Powered Social Media Automation Platform

**Centralized multi-tenant platform for connecting social accounts, scheduling posts via a persistent cron-backed job queue, and generating AI content — all from a single dashboard.**

![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 📖 Overview

Managing multiple social media accounts is time-consuming and repetitive. SocialSync solves this with a centralized, multi-tenant platform: connect accounts, schedule posts against a persistent job store, and generate AI-powered captions and images — all from one dashboard.

The system is a **stateless Express REST API** backed by MongoDB, with a **`node-cron` scheduler** that polls for due posts and dispatches them to social platforms via the Zernio publishing API. Every request is authenticated with JWTs and every data access is scoped per-user for strict tenant isolation. AI content is generated through Google Gemini (text) and Pollinations AI (images), decoupled from the publishing pipeline so generation failures never block scheduling.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Unified Dashboard** | Single-pane view of connected accounts, scheduled queue, and activity log |
| 🔗 **Multi-Account Connect** | Link multiple platforms; credentials/tokens persisted per-account and per-user |
| 📅 **Persistent Scheduler** | `node-cron` worker polls MongoDB for due posts and publishes them — survives restarts (state lives in DB, not memory) |
| 🤖 **AI Content Generator** | Platform-optimized captions via Google Gemini with structured prompt templates |
| 🎨 **AI Image Generator** | On-demand image generation via Pollinations AI (keyless), URLs persisted to Cloudinary |
| 🔐 **JWT Authentication** | Stateless auth with signed tokens, bcrypt-hashed passwords, route-level `protect` middleware |
| 🔑 **Password Reset** | Tokenized reset flow: hashed single-use token + TTL expiry, delivered over Gmail SMTP |
| 🔒 **Tenant Isolation** | Every query filtered by `userId` from the JWT — no cross-user reads/writes |
| 📝 **Activity Logging** | Immutable audit trail of publish attempts, successes, and failures |
| 🎨 **Responsive UI** | React + Vite + Tailwind, mobile-first dashboard |

---

## 🛠️ Tech Stack

**Frontend**
- React.js (Vite, TypeScript), Tailwind CSS, React Router, Axios (interceptor-based token injection)

**Backend**
- Node.js, Express.js (TypeScript), MongoDB, Mongoose (schema-level validation + indexes)

**Auth & Security**
- JWT (HS256), bcrypt.js (salted hashing), Nodemailer + Gmail SMTP, hashed TTL reset tokens

**AI & Automation**
- Google Gemini API (text generation), Pollinations AI (keyless image generation), Zernio API (cross-platform publishing), `node-cron` (scheduled dispatch)

**Storage & Media**
- Cloudinary (image CDN + transforms), Multer (multipart upload handling)

**Dev Tools**
- CodeRabbit (AI review), ESLint, Git & GitHub

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Client (React + Vite + TS)           │
│   Axios interceptor → Bearer <JWT>           │
└───────────────────────┬─────────────────────┘
                        │ HTTPS / REST
                        ▼
┌─────────────────────────────────────────────┐
│      Express REST API (stateless, TS)        │
│  ┌────────────┐  ┌──────────────────────┐    │
│  │ protect MW │→ │ Controllers          │    │
│  │  (JWT)     │  │ auth / post / account│    │
│  └────────────┘  └──────────┬───────────┘    │
│                             │                 │
│  ┌──────────────────────────▼──────────────┐ │
│  │ scheduleService (node-cron worker)       │ │
│  │  poll due posts → publish → log result   │ │
│  └──────────────────────────┬──────────────┘ │
└─────────┬─────────┬─────────┬────────────────┘
          ▼         ▼         ▼
     ┌────────┐ ┌───────┐ ┌──────────┐
     │MongoDB │ │Gemini │ │ Zernio   │──▶ Social Platforms
     └────────┘ └───────┘ └──────────┘
          ▲         ▲
     Cloudinary  Pollinations AI
```

The scheduler is **decoupled** from the request/response path: users create posts synchronously, but publication happens asynchronously when the cron worker finds a post whose `scheduledAt <= now` and `status === 'pending'`.

---

## 📂 Project Structure

```
SocialSync/
├── client/                     # React + Vite frontend (TypeScript)
│   └── src/
│       ├── api/                # Axios instance + auth interceptor
│       ├── assets/             # Platform definitions, static images
│       ├── components/         # Layout, Sidebar, Modals, Home sections
│       ├── context/            # AuthContext (JWT state, token persistence)
│       ├── pages/              # Dashboard, Accounts, Scheduler, AIComposer,
│       │                       #   Login, ResetPassword
│       └── App.tsx             # Route tree + protected route guards
│
├── server/                     # Express + TypeScript backend
│   ├── config/                 # DB, Cloudinary, Multer, Zernio, Mailer
│   ├── controllers/            # authController, postController, ...
│   ├── middlewares/            # JWT protect guard, error handler
│   ├── model/                  # User, Account, Posts, Generation, ActivityLog
│   ├── routes/                 # authRoutes, postRoutes, accountRoutes, ...
│   ├── services/               # scheduleService (node-cron dispatch loop)
│   └── server.ts               # Entry point (DB connect → cron start → listen)
│
├── docs/                       # Architecture, data-flow, deployment notes
├── README.md
└── .gitignore
```

---

## 🗃️ Data Model

| Collection | Key Fields | Notes |
|---|---|---|
| **User** | `email` (unique index), `password` (bcrypt), `resetTokenHash`, `resetTokenExpiry` | Reset token stored hashed, never in plaintext |
| **Account** | `userId` (FK), `platform`, `credentials/tokens` | Compound index on `(userId, platform)` for tenant-scoped lookups |
| **Posts** | `userId`, `content`, `imageUrl`, `platforms[]`, `scheduledAt`, `status` | `status`: `pending → published \| failed`; indexed on `(status, scheduledAt)` for the cron poll |
| **Generation** | `userId`, `prompt`, `output`, `type` | Persists AI generations for reuse/audit |
| **ActivityLog** | `userId`, `action`, `postId`, `result`, `timestamp` | Append-only audit trail |

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API key (free tier available)
- Zernio API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/socialsync.git
cd socialsync
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=3000
MONGODB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_32_char_secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_google_ai_studio_key
ZERNIO_API_KEY=your_zernio_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> `EMAIL_USER` / `EMAIL_PASS` power the forgot-password email. Generate a Gmail App Password at myaccount.google.com → Security → 2-Step Verification → App Passwords.

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Authentication Flow

```
Register → bcrypt.hash(password) → persist User
Login    → bcrypt.compare → jwt.sign({ userId }, SECRET, { expiresIn })
Request  → Axios interceptor attaches Bearer token
           → protect MW: jwt.verify → req.user = { userId }
           → controller scopes every query by req.user.userId

Forgot password → generate raw token → store SHA-256 hash + TTL
                → email raw token via Gmail SMTP
Reset           → hash incoming token → match + check expiry
                → bcrypt.hash(newPassword) → invalidate token
```

Reset tokens are **single-use** and stored hashed, so a database leak never exposes usable reset links.

---

## 🤖 AI Content Generation Flow

```
User enters topic
        │
        ▼
POST /api/ai/generate  (JWT protected)
        │
        ▼
Backend builds structured prompt → Google Gemini API
        │
        ├──▶ caption text
        └──▶ image prompt → Pollinations AI → Cloudinary upload
        │
        ▼
Generation persisted (userId, prompt, output)
        │
        ▼
Returned to dashboard → user edits → schedules → publishes
```

Text and image generation are independent calls, so an image failure still returns usable caption text.

---

## 🔄 Scheduling & Publishing Pipeline

```
Create Post (status: pending, scheduledAt: T)
        │
        ▼
node-cron tick (every minute)
        │
        ▼
Query: { status: 'pending', scheduledAt: { $lte: now } }
        │
        ▼
For each due post → Zernio API publish per platform
        │
   ┌────┴────┐
   ▼         ▼
success    failure
   │         │
   ▼         ▼
status:published   status:failed
        │
        ▼
Append ActivityLog entry
```

Because due-post state lives in MongoDB (not an in-memory timer), scheduled jobs survive server restarts and horizontal restarts pick up exactly where they left off.

---

## 🚀 Deployment

| Layer | Recommended Platform |
|---|---|
| Frontend | Vercel, Netlify |
| Backend | Render, Railway, VPS |
| Database | MongoDB Atlas |
| Media | Cloudinary |

> **Note:** run a single scheduler instance (or add a distributed lock / `findOneAndUpdate` atomic claim) to avoid double-publishing when scaling the API horizontally.

---

## 🗺️ Roadmap

- [ ] Analytics Dashboard
- [x] AI Image Generation (Pollinations AI)
- [ ] Team Collaboration
- [ ] Social Media Insights
- [ ] Multi-workspace Support
- [ ] Subscription & Payment (Stripe)
- [ ] Content Performance Tracking
- [ ] AI Content Optimization
- [ ] Distributed scheduler with atomic job claiming (multi-instance safe)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ using the MERN Stack, TypeScript, Google Gemini, Pollinations AI, and Zernio API.

If you found this project useful, please ⭐ the repository!

</div>
