# Quizly — Quiz Management & Online Assessment Platform

A full-stack Java (Spring Boot) + React implementation of the project brief: an online quiz
platform with Admin and Student roles, secure auth, quiz/question CRUD, timed attempts,
automatic scoring, results/review, a leaderboard, and analytics dashboards.

```
quiz-platform/
├── backend/    Spring Boot 3 REST API (Java 17, Maven)
└── frontend/   React 18 + Vite single-page app
```

## Feature checklist (from the brief)

**Core**
- [x] Two roles: Admin and Student, with secure JWT authentication
- [x] Admin: create/manage quizzes and questions, manage users, monitor attempts, view performance
- [x] Student: browse quizzes, attempt them, view results, review answers, track performance
- [x] CRUD operations, REST APIs, a relational database
- [x] Countdown timer per quiz, enforced server-side (not just cosmetic)
- [x] Automatic scoring system
- [x] Admin and Student dashboards, responsive layout

**Optional / advanced features also implemented**
- [x] Negative marking (configurable per quiz)
- [x] Question & option shuffling per attempt
- [x] Multiple question types: single choice, multiple choice, true/false
- [x] Configurable max attempts per quiz + scheduled open/close windows
- [x] Progressive autosave of answers during an attempt
- [x] Background job that auto-submits attempts whose timer expired without an explicit submit
- [x] Per-question explanations shown during answer review
- [x] Bulk question import endpoint
- [x] Global leaderboard + per-quiz leaderboard
- [x] Platform-wide analytics (totals, 14-day attempt trend, average score)
- [x] Per-quiz analytics (pass/fail split, toughest questions by correct-rate)
- [x] Student's personal performance analytics, broken down by category
- [x] Categories for organizing quizzes
- [x] Enable/disable and promote/demote user accounts (admin)

## Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+ and npm

## 1. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080** using an in-memory H2 database — no setup needed.
On first boot it prints a default admin login to the console:

```
Email:    admin@quizplatform.com
Password: Admin@123
```

Change these via environment variables before deploying:
`APP_ADMIN_EMAIL`, `APP_ADMIN_PASSWORD`, `APP_JWT_SECRET`, `APP_CORS_ORIGINS`.

To use PostgreSQL instead of H2:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres \
  -DDB_HOST=localhost -DDB_NAME=quiz_platform -DDB_USERNAME=postgres -DDB_PASSWORD=yourpassword
```
(or set the equivalent environment variables). Unlike H2, PostgreSQL requires the database
itself to already exist (`CREATE DATABASE quiz_platform;`) — Hibernate will create the tables
inside it automatically on startup. The H2 console is available at
`http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:quizdb`) while on the default profile.

## 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` requests to the backend
on port 8080 (see `vite.config.js`), so both can run side by side with no extra config.

- Visit `/register` to create a Student account, or sign in as the seeded Admin.
- As Admin: create a Category (optional), create a Quiz, add Questions, then **Publish** the
  quiz so it becomes visible to students.
- As Student: go to **Quizzes**, start one, answer within the timer, and submit — you'll land
  on the Result page with a full answer review.

## API overview

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth/register`, `/api/auth/login` | public |
| Categories | `/api/categories`, `/api/categories/admin/**` | read = any user, write = admin |
| Admin quizzes | `/api/admin/quizzes/**` | admin only |
| Admin questions | `/api/admin/quizzes/{quizId}/questions/**` | admin only |
| Student quiz browse | `/api/quizzes/**` | authenticated |
| Attempts | `/api/attempts/**` | authenticated (start, autosave answer, submit, result, history) |
| Leaderboard | `/api/leaderboard/quiz/{id}`, `/api/leaderboard/global` | authenticated |
| Analytics | `/api/admin/analytics/**` (admin), `/api/analytics/me` (student) | |
| Admin users | `/api/admin/users/**` | admin only |

All protected endpoints expect `Authorization: Bearer <token>` from the login/register response.

## Design notes

- Scoring, timer enforcement, and question/option shuffling all happen **server-side** — the
  client never receives correct answers until after submission, and the deadline is validated
  against the server clock so trusting the browser's timer alone can't extend an attempt.
- A `@Scheduled` job (`AttemptExpiryScheduler`) sweeps every 60s for attempts past their
  deadline that were never submitted (e.g. the student closed the tab) and auto-scores them
  from whatever autosaved answers exist, so leaderboards/analytics stay consistent.
- Passwords are BCrypt-hashed; JWTs are HMAC-SHA signed and stateless (no server sessions).
