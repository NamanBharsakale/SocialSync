<div align="center">

# 🚀 SocialSync

### AI-Powered Social Media Automation Platform

**Manage all your social media accounts from a single dashboard — schedule posts, generate AI content, and automate your workflow.**

![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![OpenAI](https://img.shields.io/badge/AI-OpenAI-412991?style=for-the-badge&logo=openai)
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
| 🤖 **AI Content Generator** | Generate engaging, platform-optimized captions with OpenAI |
| 🔐 **JWT Authentication** | Secure user registration, login, and protected routes |
| 🎨 **Responsive UI** | Modern, mobile-friendly dashboard built with Tailwind CSS |

---

## 🛠️ Tech Stack

**Frontend**
- React.js, Tailwind CSS, React Router, Axios

**Backend**
- Node.js, Express.js, MongoDB, Mongoose

**Auth & Security**
- JWT (JSON Web Tokens), bcrypt.js

**AI & Automation**
- OpenAI API, Zernio API

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
MongoDB  OpenAI  Zernio API
                     │
                     ▼
          Social Media Platforms
```

---

## 📂 Project Structure

```
SocialSync/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       └── App.jsx
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── .env
├── README.md
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- OpenAI API key
- Zernio API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/socialsync.git
cd socialsync
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
ZERNIO_API_KEY=your_zernio_api_key
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
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
Backend calls OpenAI API
        │
        ▼
AI generates optimized content
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
- [ ] AI Image Generation
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

Built with ❤️ using the MERN Stack, OpenAI API, and Zernio API.

If you found this project useful, please ⭐ the repository!

</div>