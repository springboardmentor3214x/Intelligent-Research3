# Research Funding & Innovation Intelligence Platform

An enterprise-grade AI-powered research, funding, patent landscape, technology trend, innovation assessment, notification intelligence, and reporting ecosystem.

---

## 🏛️ Platform Architecture & Modules

The platform is structured into 11 interconnected modules:

- **Module 1: Authentication & RBAC Authorization** — Supabase Auth GoTrue, session management, secure tokens, role-based access control (`institution_admin`, `faculty`, `researcher`, `evaluator`).
- **Module 2: Research Profile Management** — Researcher profiles, institutions, domains, interests, publication history, and dynamic role switcher.
- **Module 3: Research Intelligence & Paper Discovery** — Multi-source academic literature search with OpenAlex and Semantic Scholar APIs, AI synthesis, citation velocity, and gap analysis.
- **Module 4: Funding Intelligence & Grant Discovery** — Grants.gov API integration, live grant opportunities, deadline countdown trackers, side-by-side comparison, and AI grant matching.
- **Module 5: Patent Landscape Analysis** — European Patent Office (EPO OPS) stream, IPC/CPC classification clustering, white-space detection, competitor analysis, and innovation mapping.
- **Module 6: Technology Intelligence & Emerging Tech Tracking** — TRL maturity analysis, hype cycle tracking, technology adoption velocity, and competitive monitoring.
- **Module 7: Innovation Scoring Engine** — Multi-dimensional 0–100 innovation readiness scoring (novelty, market potential, feasibility, IP strength, impact).
- **Module 8: Commercialization & Tech Transfer Pipeline** — Licensing opportunity tracker, spin-off pipeline, valuation models, and IP asset management.
- **Module 9: Executive Analytics & KPI Dashboard** — Cross-module KPI aggregations, domain filters, time-range analytics, and interactive Recharts visualizations.
- **Module 10: Event-Driven Notification & Alert Intelligence System** — Real-time event bus, relevance engine, priority scoring (CRITICAL, HIGH, MEDIUM, LOW), multi-channel delivery (in-app drawer, toast, email queue), and audit trail.
- **Module 11: Enterprise Reports & Export Subsystem** — Single source of truth report generator, live data aggregation, PDF/Excel export pipeline, and report archive.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS Design System with Antigravity Floating Topbar, Neon Glowing Module Borders, and Modern Glassmorphism
- **Routing**: React Router v7
- **Charts & Data Viz**: Recharts
- **Icons**: Lucide React
- **Export Formats**: jsPDF, SheetJS (XLSX)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite / PostgreSQL (Supabase) via SQLAlchemy ORM
- **Authentication**: Supabase Auth & JWT
- **External APIs**: Semantic Scholar, OpenAlex, Grants.gov, EPO OPS, OpenAI / Gemini

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) & pip

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run development server
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

---

## 🔐 Environment Variables Configuration

Copy `.env.example` to `.env` and provide your credentials:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SEMANTIC_SCHOLAR_API_KEY=your-semantic-scholar-api-key
VITE_OPENALEX_API_KEY=your-openalex-key-or-email
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GRANTS_GOV_API_KEY=your-optional-grants-gov-key
EPO_CLIENT_ID=your-epo-ops-client-id
EPO_CLIENT_SECRET=your-epo-ops-client-secret
```

---

## 🧪 Automated Testing

```bash
# Run backend test suites
pytest backend/tests/

# Run frontend test verification
node src/services/__tests__/m10_verify.mjs
```

---

## 📄 License
Proprietary — Developed for Research Funding & Innovation Intelligence Platform.
