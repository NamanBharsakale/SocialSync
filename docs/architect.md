# SocialSync — AWS Architecture

## Overview

SocialSync is an AI-powered social media automation platform designed to run on a small AWS-only stack. The target infrastructure is intentionally limited to the following services:

- EC2 for the application backend and hosting
- RDS PostgreSQL for persistence
- S3 for media and uploaded files
- IAM for access control and least-privilege permissions

This architecture keeps the system simple, maintainable, and cost-conscious while still supporting scheduling, media storage, and secure application hosting.

---

## High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                            Users / Browser                           │
└───────────────────────────────────────┬──────────────────────────────┘
                                        │ HTTPS
                                        ▼
                        ┌──────────────────────────────┐
                        │      EC2 Instance            │
                        │  React frontend + API        │
                        │  NGINX / PM2 / Node.js       │
                        └──────────────┬───────────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
                 ▼                     ▼                     ▼
      ┌───────────────────┐   ┌────────────────────┐   ┌────────────────────┐
      │ Amazon RDS        │   │ Amazon S3 Bucket   │   │ IAM Role / Policy  │
      │ PostgreSQL        │   │ media / uploads    │   │ least privilege    │
      └───────────────────┘   └────────────────────┘   └────────────────────┘
```

The application runtime lives on EC2, while data persists in RDS and media files are stored in S3. IAM is used to grant the EC2 instance the minimum required access needed to work with S3 and run the application securely.

---

## Application Layers

### 1. Client Layer
The frontend is a React + Vite single-page app that sends requests to the backend API.

### 2. Application Layer
The backend runs on an EC2 instance with:
- Express API
- Prisma ORM
- JWT authentication middleware
- scheduler service for pending posts
- media upload handling

### 3. Data Layer
The project uses PostgreSQL on RDS, which stores:
- users
- social accounts
- scheduled posts
- generated content
- application activity logs

### 4. Storage Layer
Amazon S3 stores uploaded and generated media files. The backend generates presigned URLs for secure temporary access when needed.

### 5. Security Layer
IAM roles and instance policies ensure the EC2 application has controlled access to required AWS resources. Security groups control access to the EC2 instance and RDS database.

---

## AWS-Only Scope

This project intentionally uses only the following AWS services:

- EC2
- S3
- RDS
- IAM

No additional AWS services are required for the current architecture.

---

## Deployment Pattern

```text
Developer -> GitHub -> EC2 deployment -> Node.js app
                                  |
                                  +-> Prisma connects to RDS
                                  +-> S3 uploads for media
                                  +-> IAM role for S3 permissions
```

This keeps the deployment model simple and aligned with the current repository design.

---

## Security Design

- EC2 handles the application runtime
- RDS stores persistent relational data
- S3 stores public/private media assets
- IAM limits the EC2 instance to only the required permissions
- Environment variables are kept outside the source code
- JWT tokens are used for authenticated API access

---

## Summary

The system architecture is intentionally minimal and practical:

- app server runs on EC2
- database runs on RDS PostgreSQL
- media is stored in S3
- IAM manages access

This is the AWS architecture that matches the current project and the deployment direction requested.
