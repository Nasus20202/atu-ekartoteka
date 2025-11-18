# ATU Ekartoteka Implementation Plan

## Status: In Progress

---

## 📌 Important Guidelines

- **All code must be in English** (variables, functions, comments, etc.)
- **All commit messages must be in English**
- Follow conventional commits format: `feat:`, `fix:`, `refactor:`, etc.

---

## ✅ Completed Steps

### 1. **Project Initialization** ✅

- [x] Next.js project with TypeScript
- [x] ESLint and Prettier configuration
- [x] Project folder structure

### 2. **Docker and Database Setup** ✅

- [x] `docker-compose.yml` with PostgreSQL and Next.js app
- [x] Environment variables configuration (.env, .env.example)
- [x] Prisma ORM setup
- [x] Dockerfile for the application

### 3. **Database Model (Prisma Schema)** ✅

- [x] `User` table (admin/tenant, email, password, approval status)
- [x] `Apartment` table (apartments with fields: number, building, floor, height, active status)
- [x] Relationships between users and apartments

### 4. **Authentication System** ✅

- [x] NextAuth.js v5 for login handling
- [x] Middleware for route protection
- [x] First admin account creation script

### 5. **lok.txt File Parser** ✅

- [x] Function to read file in ISO 8859-2 encoding
- [x] Import apartments to database
- [x] Status update logic (deactivate apartments not in file, without deletion)

### 6. **Admin Panel** ✅

- [x] Dashboard with pending accounts list
- [x] Account approval and apartment assignment functionality
- [x] Interface for lok.txt file import
- [x] List of all apartments and users

### 7. **Tenant Panel** ✅

- [x] New account registration
- [x] Account status page (pending/approved)
- [x] Assigned apartment view

### 8. **API Routes** ✅

- [x] `/api/auth/*` - authentication
- [x] `/api/admin/users` - user management
- [x] `/api/admin/apartments` - apartment management
- [x] `/api/admin/import` - lok.txt file import
- [x] `/api/register` - tenant registration

### 9. **User Interface** ✅

- [x] Login page
- [x] Registration page
- [x] Admin dashboard
- [x] Tenant dashboard
- [x] Tailwind CSS / shadcn/ui usage

---

## 📋 To Do

### 10. **Tests and Documentation**

- [ ] README.md with setup instructions
- [ ] Sample test data
- [ ] Database migration scripts

### 11. **Git Workflow**

- [ ] Each major step as a separate commit after your approval
- [ ] Ability to review changes before committing

---

**Technologies:**

- Next.js 14+ (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Docker & Docker Compose
- Tailwind CSS / shadcn/ui
- ESLint + Prettier
