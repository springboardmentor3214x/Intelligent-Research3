# Intelligent Research

Research Funding & Innovation Intelligence Platform

## Project Description

AI-powered platform for research funding, innovation, patent,
technology intelligence, and commercialization insights.

## Module 1: User Authentication & Role-Based Access

This repository currently contains the foundation for Module 1 only.

### Project structure

```text
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── dependencies/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── routes/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
└── README.md
```

### Backend foundation

The backend contains a minimal FastAPI application with:
- a root endpoint
- a health endpoint
- a basic application entry point in `backend/app/main.py`

### Frontend foundation

The frontend contains a minimal React landing page that runs independently.
Authentication screens and role-based routing will be implemented in later phases.

### Requirements

Python:
- Python 3.11+

Node.js:
- Node.js 18+
- npm

### Backend installation

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# or .venv\Scripts\activate  # Windows PowerShell
pip install -r requirements.txt
```

### Backend start

```bash
cd backend
source .venv/bin/activate   # macOS/Linux
# or .venv\Scripts\activate  # Windows PowerShell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open the API in the browser:
- http://localhost:8000
- http://localhost:8000/health

### Frontend installation

From the project root:

```bash
cd frontend
npm install
```

### Frontend start

```bash
cd frontend
npm run dev
```

Open the frontend in the browser:
- http://localhost:5173

### Environment variables

Use the `.env.example` files as templates. Do not commit real secrets.

Backend example:
- `backend/.env.example`

Frontend example:
- no frontend environment file is required yet in this foundation phase

### Notes

- No authentication, JWT, OAuth2, or RBAC logic is implemented in this phase.
- No database models or API endpoints for users have been added yet.
- This is intentionally a clean foundation only.
