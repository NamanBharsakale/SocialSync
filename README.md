<div align="center">

# SocialSync

### AI-Powered Social Media Automation Platform

**A production-ready social media automation system built for AWS using EC2, S3, RDS, and IAM.**

![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3%20%7C%20RDS-FF9900?style=for-the-badge&logo=amazonaws)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## Overview

SocialSync helps users manage connected social accounts, generate AI-powered content, schedule posts, and publish them through a single dashboard. The system is designed to run fully on AWS infrastructure with the following components:

- EC2 for the backend application and hosting
- RDS PostgreSQL for persistent application data
- S3 for media and uploaded files
- IAM for least-privilege access control

The backend is a Node.js + Express application with Prisma ORM and a scheduler that checks for pending posts. The frontend is a React + Vite application that communicates with the EC2-hosted API.

---

## Core Features

- Unified dashboard for managing social content and accounts
- AI text generation using Gemini
- AI image generation flow with uploaded/generated media saved to S3
- Post scheduling and async publishing
- JWT-based authentication and account-bound access control
- Password reset flow with secure hashed tokens
- Activity logs and per-user data isolation
- AWS deployment with EC2, S3, RDS, and IAM

---

## AWS Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                              Internet                                 │
└───────────────────────────────────────┬──────────────────────────────┘
                                        │ HTTPS
                                        ▼
                        ┌──────────────────────────────┐
                        │          Browser             │
                        │   React Frontend (Vite)      │
                        └──────────────┬───────────────┘
                                       │ API calls
                                       ▼
                        ┌──────────────────────────────┐
                        │          EC2 Instance         │
                        │   Node.js + Express API       │
                        │   Nginx / reverse proxy       │
                        │   Scheduler / background job │
                        └───────┬──────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌─────────────────────┐   ┌────────────────────────────┐
        │   Amazon RDS        │   │     Amazon S3 Bucket       │
        │   PostgreSQL        │   │   media uploads / images  │
        └─────────────────────┘   └────────────────────────────┘
                    ▲
                    │
                    │ IAM Role / Instance Profile
                    │ permissions for S3 and app access
                    ▼
                    ┌─────────────────────┐
                    │   IAM Policies      │
                    │  least privilege    │
                    └─────────────────────┘
```

This architecture keeps the application focused on four AWS services only:

- EC2: application runtime
- S3: file/media storage
- RDS: relational database
- IAM: permissions and security boundaries

---

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT authentication

### Database
- PostgreSQL on AWS RDS

### Storage
- Amazon S3 for uploads and generated media

### Security
- AWS IAM role-based permissions
- EC2 security groups
- JWT and bcrypt-based app security

---

## Project Structure

```text
SocialSync/
├── client/                   # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── server/                   # Express + TypeScript backend
│   ├── config/               # Prisma, S3, Mailer, etc.
│   ├── controllers/          # Auth / post / account logic
│   ├── middlewares/          # Auth middleware and validation
│   ├── prisma/               # Prisma schema and migrations
│   ├── routes/               # Express API routes
│   ├── services/             # Scheduler / background service
│   ├── server.ts             # App entry point
│   └── package.json
│
├── docs/
│   ├── architect.md
│   └── deployment.md
├── README.md
├── package.json
└── .gitignore
```

---

## Data Model

The project uses PostgreSQL via Prisma. Primary models include:

- User
- Account
- Post
- Generation
- ActivityLog

These are defined in the Prisma schema under `server/prisma/schema.prisma`.

---

## Required AWS Resources

### 1. EC2
Use a Linux EC2 instance for:
- backend runtime
- reverse proxy / NGINX
- process management with PM2
- deployment pipeline trigger

### 2. RDS PostgreSQL
Use a managed PostgreSQL instance for:
- users
- accounts
- scheduled posts
- generations
- activity logs

### 3. S3 Bucket
Use an S3 bucket for:
- generated image uploads
- user media uploads
- signed URLs for temporary access

### 4. IAM
Use an EC2 instance profile with least-privilege permissions such as:
- S3 read/write access for the application bucket
- minimal access required for deployment tooling
- no unnecessary AWS services beyond these required permissions

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or RDS)
- AWS account with EC2, S3, RDS access
- Google Gemini API key
- Zernio API key

### Backend environment
Create `server/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/socialsync
JWT_SECRET=your_random_32_char_secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_google_ai_studio_key
ZERNIO_API_KEY=your_zernio_api_key

AWS_REGION=us-east-1
S3_BUCKET_NAME=socialsync-media

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

FRONTEND_URL=http://localhost:5173
```

### Frontend environment
Create `client/.env`:

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

The app will run at `http://localhost:5173`.

---

## Production AWS Deployment

### 1. Prepare RDS PostgreSQL
- Create an RDS PostgreSQL instance
- Set a strong master password
- Enable public access only if necessary for your network design
- Note the endpoint and database name
- Store the connection string as `DATABASE_URL`

### 2. Prepare S3
- Create a bucket for uploads and generated media
- Enable bucket versioning if required
- Configure bucket policy and IAM permissions for the EC2 instance role
- Use presigned URLs for secure temporary file access

### 3. Prepare EC2
- Launch an Ubuntu EC2 instance
- Attach an IAM role with S3 access
- Open only required inbound ports (for example 22, 80, 443)
- Install Node.js, Git, and PM2
- Clone the repository and install dependencies

### 4. Deploy backend

```bash
cd /home/ubuntu/SocialSync/server
npm install
npx prisma generate
npm run build
pm2 start dist/server.js --name socialsync-api
pm2 save
```

### 5. Configure reverse proxy
Set up NGINX on EC2 to proxy traffic to the Node.js app. Example:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Configure IAM
Attach an IAM policy to the EC2 instance role with restricted access to the required S3 bucket only. Keep it minimal and avoid unnecessary AWS permissions.

---

## Security Considerations

- Host the app on EC2 behind an NGINX reverse proxy
- Use strong JWT secrets and secure environment variables
- Keep RDS credentials in environment variables or AWS Secrets Manager if needed
- Restrict EC2 security groups to only required ports
- Give the EC2 IAM role only the S3 permissions required by the app
- Use signed URLs for temporary object access instead of exposing private bucket data broadly

---

## Deployment Notes

- The current backend deployment workflow already targets EC2, which matches the AWS-only model you requested.
- The app is not designed to run on extra AWS services beyond EC2, S3, RDS, and IAM.
- The intended production stack is intentionally simple and cost-conscious.

---

## Roadmap

- Improve EC2 deployment automation
- Add backup and restore checks for RDS
- Tighten S3 bucket policies
- Add CloudWatch monitoring and log review
- Improve scheduler resilience and duplicate-job protection

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a pull request

---

## License

[MIT](LICENSE)

---

<div align="center">

Built with AWS-native simplicity: EC2, S3, RDS, and IAM.

</div>
