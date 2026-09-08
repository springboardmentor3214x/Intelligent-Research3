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

---

## 💰 Member 4 — Kaviya (Module 4: Funding Data Ingestion) — Milestone 2

> **Branch:** `kaviya`
> **Milestone:** 2 — Funding Discovery & Research Intelligence
> **Stack:** FastAPI · SQLAlchemy 2 · Alembic · httpx · Pydantic v2 · pytest

---

### ✅ Completed Work — Module 4: Funding Data Ingestion

#### 1. FundingOpportunity ORM Model (`backend/app/models/funding.py`)
- Full `FundingOpportunity` SQLAlchemy model with all 18 contract fields
- `UNIQUE(external_id, source)` deduplication constraint
- Indexes on `status`, `deadline`, `funding_type`, `country`, `source` for fast filtering
- Compatible with both SQLite (dev) and PostgreSQL (prod)
- JSON columns for `research_areas[]` and `keywords[]`

#### 2. Pydantic v2 Schemas (`backend/app/schemas/funding.py`)
- `FundingOpportunityCreate` — used by normalizer on insert
- `FundingOpportunityUpdate` — partial update for sync job
- `FundingOpportunityRead` — stable API response shape for Member 5 & 6
- `FundingOpportunityListResponse` — paginated envelope `{ items, page, page_size, total }`
- `IngestionSummary` — sync job result report

#### 3. Database Migration (`backend/alembic/versions/001_create_funding_opportunity.py`)
- Creates `funding_opportunities` table with upgrade/downgrade
- Run with: `alembic upgrade head`

#### 4. NIH RePORTER Connector (`backend/app/services/funding_sources/nih_reporter_client.py`)
- Calls `POST https://api.reporter.nih.gov/v2/projects/search`
- No API key required — US public domain data
- Extracts: appl_id, title, org_name, abstract_text, award_amount, project_end_date, pref_terms, study_section
- Tenacity retry (3 attempts, exponential backoff) on network errors
- Returns `[]` and logs error on all failures — never raises

#### 5. Grants.gov Connector (`backend/app/services/funding_sources/grants_gov_client.py`)
- Calls `POST https://apply07.grants.gov/grantsws/rest/opportunities/search`
- No API key required — US public domain data
- Extracts: id, title, agencyName, description, awardFloor, closeDate, cfdaList, eligibilities, oppStatus
- Status mapping: `posted` → `active`, `archived` → `expired`, `closed` → `closed`

#### 6. Normalizer (`backend/app/services/funding_sources/normalizer.py`)
- Maps source-specific raw dicts → `FundingOpportunityCreate`
- Parses deadline strings in 8 formats (ISO-8601, MM/DD/YYYY, dateutil fuzzy)
- Sanitises strings to column length limits
- Rejects records with missing required fields — returns `None`, never raises
- Pydantic validation as final gate

#### 7. Ingestion Orchestrator (`backend/app/services/funding_ingestion.py`)
- Drives fetch → normalize → upsert pipeline per source
- Primary dedup: `external_id + source`
- Fallback dedup: `title + organization + deadline_date`
- Updates 10 fields on changed existing records
- Returns `IngestionSummary` with counts

#### 8. CLI Sync Job (`backend/app/jobs/funding_sync.py`)
- Repeatable import command: `python -m app.jobs.funding_sync`
- Flags: `--keywords`, `--limit`, `--sources`
- Prints formatted summary table
- Exits code 1 on errors, 0 on success

#### 9. Tests (`backend/tests/test_funding_ingestion.py`)
- 12 unit tests covering all Definition of Done scenarios
- In-memory SQLite — no external DB or network required
- Mocked source clients using `pytest-mock` + `AsyncMock`

#### 10. API Router Stub (`backend/app/routers/funding.py`)
- `/api/funding/status` — returns record count
- `GET /api/funding` — paginated list stub
- `GET /api/funding/{id}` — detail endpoint stub
- Stub ready for Member 5 to implement full search/auth layer

---

### 📁 Files Added (Milestone 2)

```
backend/
├── requirements.txt
├── .env.example
├── README.md                                    ← Member 5 handoff docs
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_create_funding_opportunity.py    ← DB migration
└── app/
    ├── __init__.py
    ├── main.py
    ├── config.py
    ├── database.py
    ├── models/
    │   └── funding.py                           ← FundingOpportunity ORM
    ├── schemas/
    │   └── funding.py                           ← Pydantic v2 schemas
    ├── services/
    │   ├── funding_ingestion.py                 ← Upsert orchestrator
    │   └── funding_sources/
    │       ├── base.py
    │       ├── nih_reporter_client.py           ← NIH RePORTER connector
    │       ├── grants_gov_client.py             ← Grants.gov connector
    │       └── normalizer.py                   ← Raw → schema normalizer
    ├── routers/
    │   └── funding.py                           ← API stub for Member 5
    └── jobs/
        └── funding_sync.py                      ← CLI sync runner
tests/
└── test_funding_ingestion.py                    ← 12 unit tests
```

---

### 🚀 How to Run (Milestone 2)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env             # SQLite default works out of the box
alembic upgrade head             # Create funding_opportunities table
python -m app.jobs.funding_sync  # Fetch from NIH + Grants.gov
pytest tests/ -v                 # Run all tests
uvicorn app.main:app --reload    # Start API at http://localhost:8000
```

---

### 🔗 Member 4 → Member 5 Handoff

| Item | Location |
|---|---|
| ORM model + migration | `backend/app/models/funding.py`, `alembic/versions/001_*` |
| API response schemas | `backend/app/schemas/funding.py` |
| Router skeleton | `backend/app/routers/funding.py` |
| Sample sync output | Run `python -m app.jobs.funding_sync --limit 5` |
| Field mapping docs | `backend/README.md` → Data Contract table |
| Error/dedup notes | `backend/README.md` → Member 5 Handoff Notes |