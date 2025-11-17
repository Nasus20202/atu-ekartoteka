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

---

## 📋 To Do

### 3. **Database Model (Prisma Schema)**

- [ ] `User` table (admin/tenant, email, password, approval status)
- [ ] `Apartment` table (apartments with fields: number, building, floor, height, active status)
- [ ] Relationships between users and apartments

### 4. **Authentication System**

- [ ] NextAuth.js for login handling
- [ ] Middleware for route protection
- [ ] First admin account creation logic on initial startup

### 5. **lok.txt File Parser**

- [ ] Function to read file in ISO 8859-2 encoding
- [ ] Import apartments to database
- [ ] Status update logic (deactivate apartments not in file, without deletion)

### 6. **Admin Panel**

- [ ] Dashboard with pending accounts list
- [ ] Account approval and apartment assignment functionality
- [ ] Interface for lok.txt file import
- [ ] List of all apartments and users

### 7. **Tenant Panel**

- [ ] New account registration
- [ ] Account status page (pending/approved)
- [ ] Assigned apartment view

### 8. **API Routes**

- [ ] `/api/auth/*` - authentication
- [ ] `/api/admin/users` - user management
- [ ] `/api/admin/apartments` - apartment management
- [ ] `/api/admin/import` - lok.txt file import
- [ ] `/api/register` - tenant registration

### 9. **User Interface**

- [ ] Login page
- [ ] Registration page
- [ ] Admin dashboard
- [ ] Tenant dashboard
- [ ] Tailwind CSS / shadcn/ui usage

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
