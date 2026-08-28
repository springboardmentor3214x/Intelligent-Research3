# Intelligent Research

Research Funding & Innovation Intelligence Platform

## Project Description

AI-powered platform for research funding, innovation, patent,
technology intelligence, and commercialization insights.

---

## 👤 Member 4 — Kaviya (Pair B: JWT, OAuth2 & RBAC — Frontend)

> **Branch:** `kaviya`  
> **Milestone:** 1 — User Authentication & Role-Based Access Control  
> **Stack:** React 18 + Vite + Axios + React Router v6

---

### ✅ Completed Work

#### 1. Auth State Handling (`src/context/AuthContext.jsx`)
- Global authentication context using React Context API
- Persists `token` and `user` across page reloads using `localStorage`
- On app load, validates stored token against `GET /users/me` to auto-logout expired sessions
- Exposes:
  - `login(token, user)` — called after successful login
  - `logout()` — clears localStorage + redirects to `/login`
  - `refreshUser()` — re-fetches `/users/me` to sync state (e.g. after profile update)
  - `role` — derived from `user.role`
  - `isAuthenticated` — boolean flag
  - `loading` — true while session is being verified on mount

#### 2. Axios Interceptor (`src/services/api.js`)
- Replaced bare `fetch` with a configured **Axios** instance
- **Request interceptor** — auto-attaches `Authorization: Bearer <token>` to every API call
- **Response interceptor** — catches global `401 Unauthorized` → clears credentials + redirects to `/login` automatically
- Named API helpers:
  - `getMe()` — `GET /users/me`
  - `updateMe(data)` — `PUT /users/me`
  - `loginRequest(email, password)` — `POST /auth/login`
  - `registerRequest(payload)` — `POST /auth/register`

#### 3. Protected Routes (`src/routes/ProtectedRoute.jsx` + `src/routes/AppRoutes.jsx`)
- **`ProtectedRoute`** — reusable guard component with:
  - Loading spinner while auth is being determined on mount
  - Redirect to `/login` for unauthenticated users
  - Redirect to `/unauthorized` for wrong-role users (`allowedRoles` prop)
- **`AppRoutes`** — full application route map:
  | Route | Access | Page |
  |-------|--------|------|
  | `/` | — | Redirects to `/dashboard` or `/login` |
  | `/login` | Public | LoginPage |
  | `/register` | Public | RegisterPage |
  | `/dashboard` | Any authenticated role | DashboardPage |
  | `/profile` | Any authenticated role | ProfilePage |
  | `/admin` | `admin` role only | Admin placeholder |
  | `/unauthorized` | Public | UnauthorizedPage (403) |
  | `*` | — | Catch-all redirect |

#### 4. Role-Based Navigation (`src/components/Navbar.jsx`)
- Fixed glassmorphism navbar (backdrop-filter blur)
- Shows navigation links: **Dashboard**, **Profile**, and **Admin** (admin-only)
- Displays logged-in user's **name/email** + **role badge** (colour-coded)
- **Logout button** with loading state spinner
- Fully **responsive** with animated hamburger menu for mobile

#### 5. Profile Page (`src/pages/ProfilePage.jsx`)
- Calls `GET /users/me` on mount (via AuthContext)
- **View mode** — displays: Full Name, Email, Role, User ID
- **Edit mode** — inline form with:
  - Client-side validation (name required, max 100 chars)
  - Calls `PUT /users/me` on save
  - Calls `refreshUser()` to sync context after update
  - Success/error alert feedback
  - Loading state on save button

#### 6. Dashboard Page (`src/pages/DashboardPage.jsx`)
- Time-aware greeting (Good morning / afternoon / evening)
- Hero card with user's name, role badge, avatar with initials
- Admin users see an extra **Admin Panel** shortcut
- Stat cards (Publications, Research Areas, Patents — placeholders)
- Module navigation cards linking to Profile and future modules

#### 7. Unauthorized Page (`src/pages/UnauthorizedPage.jsx`)
- Clean 403 page with floating lock icon animation
- "Go Back" + "Dashboard / Login" action buttons

#### 8. Login & Register Page Stubs (`src/pages/LoginPage.jsx`, `RegisterPage.jsx`)
- Fully functional stubs so auth flow can be tested independently
- Wired to real API endpoints (`POST /auth/login`, `POST /auth/register`)
- **Note:** Pair A (Member 2) owns and will replace these with their full-featured versions

#### 9. Global Design System (`src/index.css`)
- Premium dark theme with CSS custom properties (design tokens)
- Components: Cards, Buttons (primary/secondary/ghost/danger), Form inputs, Badges, Alerts, Skeletons, Avatars, Spinner
- Smooth animations: `slideIn`, `scaleIn`, `fadeIn`, `float`, `shimmer`
- Responsive typography with Google Fonts (Inter + Outfit)
- Custom scrollbar styling + focus-visible ring

---

### 📁 Files Added / Modified

```
frontend/
├── .env.example                            ← env variable template
├── index.html                              ← Google Fonts preloaded
├── package.json                            ← added axios dependency
├── vite.config.js                          ← /api proxy to backend :8000
└── src/
    ├── App.jsx                             ← BrowserRouter + AuthProvider + AppRoutes
    ├── index.css                           ← [NEW] full design system
    ├── main.jsx                            ← React 18 entry point
    ├── context/
    │   └── AuthContext.jsx                 ← [COMPLETE] auth state management
    ├── services/
    │   └── api.js                          ← [REWRITTEN] axios + interceptors
    ├── routes/
    │   ├── AppRoutes.jsx                   ← [COMPLETE] route map with guards
    │   └── ProtectedRoute.jsx              ← [NEW] role-based route guard
    ├── components/
    │   ├── Navbar.jsx                      ← [NEW] role-aware navigation
    │   └── Navbar.css
    └── pages/
        ├── DashboardPage.jsx               ← [NEW] authenticated home
        ├── DashboardPage.css
        ├── ProfilePage.jsx                 ← [NEW] GET/PUT /users/me
        ├── ProfilePage.css
        ├── UnauthorizedPage.jsx            ← [NEW] 403 page
        ├── UnauthorizedPage.css
        ├── LoginPage.jsx                   ← [STUB] Pair A owns this
        ├── RegisterPage.jsx                ← [STUB] Pair A owns this
        └── AuthPage.css
```

---

### 🔌 API Endpoints Used

| Method | Endpoint | Used In |
|--------|----------|---------|
| `POST` | `/auth/login` | LoginPage stub |
| `POST` | `/auth/register` | RegisterPage stub |
| `GET` | `/users/me` | AuthContext (on mount + refreshUser) |
| `PUT` | `/users/me` | ProfilePage (edit mode) |

> Backend base URL configured via `VITE_API_URL` in `.env` (defaults to `http://localhost:8000`)

---

### 🚀 How to Run

```bash
cd frontend
cp .env.example .env          # set VITE_API_URL if needed
npm install
npm run dev                   # http://localhost:5173
```

---

### 🔗 Dependencies on Other Members

| Depends on | For |
|-----------|-----|
| **Member 3** (backend JWT middleware) | Token validation, `/users/me`, role field in JWT payload |
| **Member 1** (backend auth endpoints) | `POST /auth/login` and `POST /auth/register` response shape |
| **Member 2** (Pair A frontend) | Will replace `LoginPage.jsx` and `RegisterPage.jsx` stubs |