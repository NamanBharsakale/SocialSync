<div align="center">

# 🚀 SocialSync

### AI-Powered Social Media Automation Platform

**Manage all your social media accounts from a single dashboard — schedule posts, generate AI content, and automate your workflow.**

![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 📖 Overview

Managing multiple social media accounts is time-consuming and repetitive. SocialSync solves this by providing a centralized platform where you can connect accounts, schedule posts, and generate AI-powered content — all from one clean dashboard.

This project demonstrates how to build a real-world AI SaaS application using the MERN stack, OpenAI APIs, and modern third-party integrations.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Unified Dashboard** | Manage all social media activity from a single interface |
| 🔗 **Multi-Account Connect** | Link and manage multiple social media platforms |
| 📅 **Post Scheduler** | Schedule posts for automatic future publication |
| 🤖 **AI Content Generator** | Generate engaging, platform-optimized captions with Google Gemini |
| 🎨 **AI Image Generator** | Generate post images automatically via Pollinations AI (free, no key needed) |
| 🔐 **JWT Authentication** | Secure user registration, login, and protected routes |
| 🔑 **Password Reset** | Forgot-password email flow with secure tokenized reset links (Gmail SMTP) |
| 🔒 **Account Isolation** | Each user's social accounts are strictly scoped — no cross-user data leakage |
| 🎨 **Responsive UI** | Modern, mobile-friendly dashboard built with Tailwind CSS |

---

## 🛠️ Tech Stack

**Frontend**
- React.js, Tailwind CSS, React Router, Axios

**Backend**
- Node.js, Express.js, MongoDB, Mongoose

**Auth & Security**
- JWT (JSON Web Tokens), bcrypt.js, Nodemailer + Gmail SMTP (transactional email)

**AI & Automation**
- Google Gemini API (text generation), Pollinations AI (image generation, free), Zernio API

**Dev Tools**
- CodeRabbit, Git & GitHub

---

## 🏗️ Architecture

```
Client (React.js)
        │
        ▼
Backend API (Node.js + Express.js)
        │
   ┌────┼────┐
   ▼    ▼    ▼
MongoDB  Gemini  Pollinations AI  Zernio API
                     │
                     ▼
          Social Media Platforms
```

---

## 📂 Project Structure

```
SocialSync/
├── client/                     # React + Vite frontend (TypeScript)
│   └── src/
│       ├── api/                # Axios instance
│       ├── assets/             # Platform definitions, static images
│       ├── components/         # Layout, Sidebar, Modals, Home sections
│       ├── context/            # AuthContext (JWT state)
│       ├── pages/              # Dashboard, Accounts, Scheduler, AIComposer,
│       │                       #   Login, ResetPassword
│       └── App.tsx             # Route tree
│
├── server/                     # Express + TypeScript backend
│   ├── config/                 # DB, Cloudinary, Multer, Zernio, Mailer
│   ├── controllers/            # authController, postController, ...
│   ├── middlewares/            # JWT protect guard
│   ├── model/                  # User, Account, Posts, Generation, ActivityLog
│   ├── routes/                 # authRoutes, postRoutes, accountRoutes, ...
│   ├── services/               # scheduleService (node-cron)
│   └── server.ts               # Entry point
│
├── docs/                       # Architecture, flows, deployment notes
├── README.md
└── .gitignore
```

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

## 🤖 AI Content Generation Flow

```
User enters a topic
        │
        ▼
Request sent to backend
        │
        ▼
Backend calls Google Gemini API
        │
        ▼
AI generates optimized content + image prompt
        │
        ▼
Content returned to dashboard
        │
        ▼
User edits → Schedules → Publishes
```

---

## 🔄 Automation Flow

```
Create Post → Generate AI Content → Select Platforms
                                           │
                                           ▼
                              Schedule Time → Zernio API → Auto-Publish
```

---

## 🚀 Deployment

| Layer | Recommended Platform |
|---|---|
| Frontend | Vercel, Netlify |
| Backend | Render, Railway, VPS |
| Database | MongoDB Atlas |

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

Built with ❤️ using the MERN Stack, Google Gemini, Pollinations AI, and Zernio API.

If you found this project useful, please ⭐ the repository!

</div>