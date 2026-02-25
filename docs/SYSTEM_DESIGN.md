# CloudVault — RESTful API System Design

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [API Design Principles](#3-api-design-principles)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [File Storage](#7-file-storage)
8. [Error Handling](#8-error-handling)
9. [Pagination & Search](#9-pagination--search)
10. [Security Considerations](#10-security-considerations)
11. [Scalability & Performance](#11-scalability--performance)
12. [Deployment Architecture](#12-deployment-architecture)

---

## 1. Introduction

CloudVault is a cloud-based file sharing and management platform. This document describes the system design of its RESTful API, which serves as the backend for a React single-page application. The API follows REST conventions and provides endpoints for user authentication, file management, permission-based sharing, and administration.

### Key Capabilities

- User registration and JWT-based authentication
- File upload, retrieval, streaming, and deletion
- Request-based file sharing with approval workflows
- Role-based access control (User / Admin)
- Paginated and searchable resource listings

---

## 2. Architecture Overview

```
┌─────────────┐         HTTPS          ┌─────────────────┐
│             │ ◄─────────────────────► │                 │
│  React SPA  │    JSON / Multipart     │  Express API    │
│  (Vite)     │                         │  (Node.js)      │
│             │                         │                 │
└─────────────┘                         └────────┬────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    │            │            │
                                    ▼            ▼            ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ MongoDB  │ │Cloudinary│ │  JWT     │
                              │ Atlas    │ │ (Files)  │ │ (Auth)   │
                              └──────────┘ └──────────┘ └──────────┘
```

### Component Responsibilities

| Component | Technology | Role |
|-----------|-----------|------|
| Client | React 19, Vite, Tailwind CSS | User interface, SPA routing |
| API Server | Node.js, Express 5 | Business logic, request handling |
| Database | MongoDB (Mongoose ODM) | Persistent data storage |
| File Storage | Cloudinary | Binary file storage (images, PDFs) |
| Authentication | JSON Web Tokens (JWT) | Stateless user authentication |

### Request Lifecycle

```
Client Request
  │
  ▼
CORS Middleware ──► JSON Body Parser ──► Route Matching
                                              │
                                              ▼
                                      Auth Middleware
                                      (JWT Verification)
                                              │
                                              ▼
                                      Validators
                                      (Input Validation)
                                              │
                                              ▼
                                      Controller
                                      (Business Logic)
                                              │
                                   ┌──────────┼──────────┐
                                   ▼          ▼          ▼
                              MongoDB    Cloudinary    Response
                              (CRUD)     (Upload/      (JSON)
                                          Delete)
```

---

## 3. API Design Principles

The CloudVault API adheres to the following RESTful design principles:

### Resource-Oriented URLs

Endpoints are organized around resources, not actions:

```
GET    /api/files          # List files (collection)
POST   /api/files/upload   # Create a file
GET    /api/files/:id      # Retrieve a file (single resource)
DELETE /api/files/:id      # Delete a file
```

### Standard HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| `GET` | Retrieve resource(s) | Yes |
| `POST` | Create a resource | No |
| `PUT` | Update a resource | Yes |
| `DELETE` | Remove a resource | Yes |

### Consistent Response Format

All responses use JSON with appropriate HTTP status codes:

```json
// Success
{ "message": "File uploaded successfully", "file": { ... } }

// Error
{ "message": "Unauthorized access" }
```

### Stateless Communication

Every request carries all information needed for processing (via the JWT in the `Authorization` header). No server-side sessions are used.

---

## 4. Data Models

### 4.1 User

Stores registered user accounts.

```
┌─────────────────────────────────┐
│             User                │
├─────────────────────────────────┤
│ _id        : ObjectId (PK)     │
│ name       : String (required)  │
│ email      : String (unique)    │
│ password   : String (hashed)    │
│ role       : Enum [user, admin] │
│ createdAt  : Date               │
│ updatedAt  : Date               │
├─────────────────────────────────┤
│ Pre-save: normalize email to    │
│ lowercase, hash password with   │
│ bcrypt (10 salt rounds)         │
└─────────────────────────────────┘
```

### 4.2 File

Represents an uploaded file and its Cloudinary metadata.

```
┌─────────────────────────────────┐
│             File                │
├─────────────────────────────────┤
│ _id        : ObjectId (PK)     │
│ user       : ObjectId (FK→User)│
│ filename   : String (required)  │
│ url        : String (Cloudinary)│
│ publicId   : String (Cloudinary)│
│ type       : String (MIME type) │
│ size       : Number (bytes)     │
│ createdAt  : Date               │
│ updatedAt  : Date               │
└─────────────────────────────────┘
```

### 4.3 Permission

Tracks file-sharing access requests and their status.

```
┌──────────────────────────────────────┐
│           Permission                 │
├──────────────────────────────────────┤
│ _id        : ObjectId (PK)          │
│ file       : ObjectId (FK→File)     │
│ owner      : ObjectId (FK→User)     │
│ requester  : ObjectId (FK→User)     │
│ access     : Enum [view, edit]      │
│ status     : Enum [pending,         │
│              approved, rejected]     │
│ hidden     : Boolean (default false)│
│ createdAt  : Date                    │
│ updatedAt  : Date                    │
└──────────────────────────────────────┘
```

### Entity Relationship Diagram

```
┌──────┐       1:N       ┌──────┐       1:N       ┌────────────┐
│ User │ ───────────────► │ File │ ───────────────► │ Permission │
│      │                  │      │                  │            │
│      │ ◄──── owner ─────┤      │                  │            │
│      │ ◄── requester ───┤      │                  │            │
└──────┘                  └──────┘                  └────────────┘

A User owns many Files.
A File can have many Permissions.
A Permission links a File owner to a requester User.
```

---

## 5. API Endpoints

### 5.1 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/auth/admin/users` | Admin | List all users with their files |

#### `POST /api/auth/signup`

```
Request Body:
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securePassword123"
}

Response (201):
{
  "message": "User registered successfully",
  "token": "<jwt>"
}
```

#### `POST /api/auth/login`

```
Request Body:
{
  "email": "alice@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "user"
  }
}
```

---

### 5.2 Files — `/api/files`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/files/upload` | User | Upload a file (max 5 MB) |
| `GET` | `/api/files` | User | List user's files (paginated) |
| `GET` | `/api/files/:id` | User | Get file details |
| `GET` | `/api/files/:id/view` | Token | Stream/view a PDF inline |
| `GET` | `/api/files/share/:id` | No | Get public file info for sharing |
| `DELETE` | `/api/files/:id` | User | Delete a file |
| `GET` | `/api/files/admin/all` | Admin | List all files (admin) |
| `DELETE` | `/api/files/admin/:id` | Admin | Force-delete any file (admin) |

#### `POST /api/files/upload`

```
Request: multipart/form-data
  - file: binary (PDF or image, ≤ 5 MB)

Response (201):
{
  "message": "File uploaded successfully",
  "file": {
    "_id": "...",
    "filename": "report.pdf",
    "url": "https://res.cloudinary.com/...",
    "type": "application/pdf",
    "size": 204800
  }
}
```

#### `GET /api/files?page=1&limit=10&search=report`

```
Response (200):
{
  "files": [ ... ],
  "totalPages": 5,
  "currentPage": 1
}
```

---

### 5.3 Permissions — `/api/permissions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/permissions/request` | User | Request access to a file |
| `PUT` | `/api/permissions/approve/:id` | Owner | Approve an access request |
| `PUT` | `/api/permissions/reject/:id` | Owner | Reject an access request |
| `DELETE` | `/api/permissions/revoke/:id` | Owner | Revoke an active share |
| `GET` | `/api/permissions/my` | User | List my permission requests |
| `GET` | `/api/permissions/owner` | Owner | List pending requests for my files |
| `GET` | `/api/permissions/owner/active` | Owner | List active shares of my files |
| `GET` | `/api/permissions/shared-with-me` | User | List files shared with me |
| `PUT` | `/api/permissions/:id/hide` | User | Hide a shared file from dashboard |

#### Permission Workflow

```
Requester                    Owner                      System
    │                          │                          │
    │  POST /request           │                          │
    │─────────────────────────►│                          │
    │                          │   Permission created     │
    │                          │   (status: pending)      │
    │                          │◄─────────────────────────│
    │                          │                          │
    │                          │  PUT /approve/:id        │
    │                          │─────────────────────────►│
    │                          │   status → approved      │
    │                          │◄─────────────────────────│
    │                          │                          │
    │  GET /shared-with-me     │                          │
    │─────────────────────────────────────────────────────►
    │                    File now accessible               │
    │◄─────────────────────────────────────────────────────│
```

---

### 5.4 Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin` | Admin | List all admins |
| `POST` | `/api/admin` | Admin | Create a new admin |
| `DELETE` | `/api/admin/:id` | Admin | Delete an admin |
| `PUT` | `/api/admin/demote/:id` | Admin | Demote an admin to user |

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌────────┐                          ┌────────┐                ┌─────────┐
│ Client │                          │ Server │                │ MongoDB │
└───┬────┘                          └───┬────┘                └────┬────┘
    │                                   │                          │
    │  POST /api/auth/login             │                          │
    │  { email, password }              │                          │
    │──────────────────────────────────►│                          │
    │                                   │  Find user by email      │
    │                                   │─────────────────────────►│
    │                                   │  User document           │
    │                                   │◄─────────────────────────│
    │                                   │                          │
    │                                   │  bcrypt.compare()        │
    │                                   │  jwt.sign({ id, role })  │
    │                                   │                          │
    │  { token, user }                  │                          │
    │◄──────────────────────────────────│                          │
    │                                   │                          │
    │  GET /api/files                   │                          │
    │  Authorization: Bearer <token>    │                          │
    │──────────────────────────────────►│                          │
    │                                   │  jwt.verify(token)       │
    │                                   │  req.user = decoded      │
    │                                   │                          │
    │  { files: [...] }                 │                          │
    │◄──────────────────────────────────│                          │
```

### 6.2 JWT Token Structure

```json
{
  "id": "user_object_id",
  "role": "user | admin",
  "iat": 1700000000,
  "exp": 1700086400
}
```

- **Signing Algorithm**: HS256
- **Expiry**: 24 hours
- **Transport**: `Authorization: Bearer <token>` header

### 6.3 Authorization Middleware

| Middleware | Purpose |
|-----------|---------|
| `authMiddleware` | Verifies JWT, attaches `req.user` |
| `adminMiddleware` | Checks `req.user.role === 'admin'` |

### 6.4 Access Control Matrix

| Resource | Owner | Approved User | Admin | Public |
|----------|-------|---------------|-------|--------|
| Upload file | ✅ | — | ✅ | ❌ |
| View own files | ✅ | — | ✅ | ❌ |
| View shared file | — | ✅ (view/edit) | ✅ | ❌ |
| Delete file | ✅ | ✅ (edit only) | ✅ | ❌ |
| Share link info | — | — | — | ✅ |
| Approve/reject requests | ✅ | ❌ | ❌ | ❌ |
| Manage admins | ❌ | ❌ | ✅ | ❌ |

---

## 7. File Storage

### Upload Pipeline

```
Client                    Express                  Cloudinary
  │                          │                          │
  │  POST /upload            │                          │
  │  (multipart/form-data)   │                          │
  │─────────────────────────►│                          │
  │                          │                          │
  │                     Multer parses                   │
  │                     file to memory                  │
  │                     buffer                          │
  │                          │                          │
  │                     Validate:                       │
  │                     - Type (PDF/image)              │
  │                     - Size (≤ 5 MB)                 │
  │                          │                          │
  │                          │  cloudinary.upload()     │
  │                          │  (stream from buffer)    │
  │                          │─────────────────────────►│
  │                          │                          │
  │                          │  { url, public_id }      │
  │                          │◄─────────────────────────│
  │                          │                          │
  │                     Save File doc                   │
  │                     to MongoDB                      │
  │                          │                          │
  │  { file metadata }       │                          │
  │◄─────────────────────────│                          │
```

### Resource Type Mapping

| File Type | Cloudinary Resource Type | Folder |
|-----------|------------------------|--------|
| PDF (`application/pdf`) | `raw` | `cloudvault/` |
| Images (JPEG, PNG, etc.) | `image` | `cloudvault/` |

### Deletion Cascade

When a file is deleted:
1. The Cloudinary asset is destroyed (`cloudinary.uploader.destroy`)
2. All associated `Permission` documents are removed
3. The `File` document is deleted from MongoDB

---

## 8. Error Handling

### HTTP Status Codes

| Code | Meaning | Example Usage |
|------|---------|---------------|
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST (signup, upload) |
| `400` | Bad Request | Missing or invalid fields |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Unexpected server failure |

### Error Response Format

```json
{
  "message": "Human-readable error description"
}
```

### Common Error Scenarios

| Scenario | Status | Message |
|----------|--------|---------|
| No token provided | 401 | `"No token, authorization denied"` |
| Invalid token | 401 | `"Token is not valid"` |
| User not admin | 403 | `"Access denied. Admins only."` |
| File not found | 404 | `"File not found"` |
| Duplicate email | 400 | `"User already exists"` |
| File too large | 400 | `"File size exceeds 5MB limit"` |
| Unsupported type | 400 | `"Only PDF and image files are allowed"` |

---

## 9. Pagination & Search

### Pagination Pattern

All list endpoints support cursor-free offset pagination:

```
GET /api/files?page=2&limit=10
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 10 | Items per page |

### Response Structure

```json
{
  "files": [ /* array of file objects */ ],
  "totalPages": 5,
  "currentPage": 2
}
```

### Search

File listing supports name-based search using regex:

```
GET /api/files?search=annual+report
```

The server applies a case-insensitive regex match against the `filename` field:

```javascript
{ filename: { $regex: searchQuery, $options: "i" } }
```

---

## 10. Security Considerations

### Implemented Measures

| Measure | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Authentication** | Stateless tokens with expiry |
| **CORS** | Restricted to allowed origins |
| **Role-Based Access** | Middleware-enforced admin checks |
| **Email Normalization** | Lowercase storage prevents duplicates |
| **File Validation** | Type and size checks before upload |
| **Ownership Verification** | Controllers verify resource ownership |
| **Super Admin Protection** | Designated super admin cannot be deleted |

### Recommended Enhancements

| Enhancement | Purpose |
|-------------|---------|
| **Rate Limiting** | Prevent brute-force and DDoS attacks |
| **Input Validation** | Schema-based request body validation (e.g., Joi, Zod) |
| **Helmet.js** | Set security-related HTTP headers |
| **HTTPS Enforcement** | Encrypt data in transit |
| **Refresh Tokens** | Improve token rotation and session management |
| **Audit Logging** | Track sensitive operations (deletions, role changes) |
| **CSRF Protection** | Guard against cross-site request forgery |

---

## 11. Scalability & Performance

### Current Architecture

```
                    ┌─────────────────┐
                    │   Single Node   │
                    │  Express Server │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │   MongoDB Atlas │
                    │   (Managed)     │
                    └─────────────────┘
```

### Scaling Strategies

#### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Server 1 │ │ Server 2 │ │ Server N │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌──────────────┐
                    │ MongoDB Atlas│
                    │ (Replica Set)│
                    └──────────────┘
```

Since the API is stateless (JWT-based auth, no sessions), it can scale horizontally behind a load balancer without session affinity.

#### Database Optimization

| Strategy | Benefit |
|----------|---------|
| **Indexes** on `email`, `user`, `file` fields | Faster queries |
| **MongoDB Atlas Replica Sets** | Read scaling and high availability |
| **Connection Pooling** (Mongoose default) | Efficient DB connections |

#### Caching

| Layer | Tool | Target |
|-------|------|--------|
| API Response Cache | Redis | Frequently accessed file listings |
| CDN | Cloudinary CDN | File delivery (images, PDFs) |

#### File Upload Optimization

| Strategy | Benefit |
|----------|---------|
| **Memory buffer** (Multer) | Avoids disk I/O on server |
| **Stream upload** to Cloudinary | Reduces memory footprint |
| **5 MB limit** | Prevents resource exhaustion |

---

## 12. Deployment Architecture

### Current Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└──────────┬──────────────────────────────────┬────────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐            ┌─────────────────────┐
│   Vercel            │            │   Render            │
│   (React Client)    │───────────►│   (Express API)     │
│                     │  API Calls │                     │
│   cloudvault-       │            │   Port 5000         │
│   two.vercel.app    │            │                     │
└─────────────────────┘            └──────────┬──────────┘
                                              │
                                   ┌──────────┼──────────┐
                                   ▼                     ▼
                            ┌──────────────┐     ┌──────────────┐
                            │ MongoDB Atlas│     │  Cloudinary  │
                            │ (Database)   │     │  (Files)     │
                            └──────────────┘     └──────────────┘
```

### Keep-Alive Mechanism

The server includes a self-ping mechanism (every 14 minutes) to prevent Render's free-tier instances from sleeping:

```javascript
setInterval(() => {
  https.get(SELF_URL);
}, 14 * 60 * 1000);
```

### Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `PORT` | Express | Server port |
| `MONGO_URI` | MongoDB Atlas | Database connection string |
| `JWT_SECRET` | JWT | Token signing key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Cloud account name |
| `CLOUDINARY_API_KEY` | Cloudinary | API key |
| `CLOUDINARY_API_SECRET` | Cloudinary | API secret |
| `SELF_URL` | Render | Keep-alive ping target |

---

*This document describes the system design of the CloudVault RESTful API as currently implemented. It is intended to serve as a reference for contributors, reviewers, and future development planning.*
