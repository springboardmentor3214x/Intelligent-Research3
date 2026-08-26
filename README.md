# 🚀 Intelligent Research: AI-Powered Funding & Innovation Intelligence Platform

> An AI-driven platform for research funding discovery, patent analysis, technology intelligence, and commercialization insights.

---

## 📌 Project Overview

**Intelligent Research** bridges the gap between scientific research, funding opportunities, patent intelligence, and tech commercialization. Designed for researchers, startup founders, innovation managers, and institutional administrators, the platform uses AI insights to streamline R&D discovery, match projects with grant opportunities, and track innovation metrics.

---

## ✨ Key Features

- **🔐 Multi-Role User Authentication**: Secure authentication with JWT tokens & password hashing for Researchers, Founders, Managers, and Admins.
- **🎯 AI-Driven Grant Matching**: Intelligent recommendations aligning research projects with active funding programs and grants.
- **📜 Patent & IP Intelligence**: Deep-dive analytics on patents, technology whitepapers, and intellectual property landscapes.
- **💡 Innovation & Commercialization Pipelines**: Insights and workflows to transition lab discoveries into commercial products.
- **⚡ Modern Glassmorphism Interface**: Sleek, responsive React UI powered by Vite and custom CSS design tokens.
- **🛠️ High-Performance REST API**: Fast, auto-documented FastAPI backend with Pydantic v2 validation & SQLite/SQLAlchemy ORM database integration.

---

## 👥 User Roles & Access

| Role | Core Capabilities |
| :--- | :--- |
| **🔬 Researcher** | Discover R&D grants, track academic publications, analyze funding trends |
| **🚀 Startup Founder** | Match with innovation grants, perform patent clearance, access tech transfers |
| **💼 Innovation Manager** | Track R&D portfolio performance, oversee tech transfer pipelines, measure ROI |
| **🛡️ Administrator** | Platform configuration, user validation, security enforcement & system health |

---

## 🛠️ Technology Stack

### **Backend (`/backend`)**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM / Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & SQLite (`app.db`)
- **Security & Auth**: Passlib (`bcrypt`), PyJWT (`HS256`)
- **Data Validation**: Pydantic v2
- **Testing**: Pytest & HTTPX

### **Frontend (`/Intelligent-Research(Gopi)/Login`)**
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System, Glassmorphism, Theme Variables)
- **Linting**: Oxlint

---

## 📁 Repository Structure

```
Infosys/
├── backend/                             # FastAPI Backend Service
│   ├── main.py                          # App entry point, CORS & exception handlers
│   ├── database.py                      # SQLAlchemy DB engine & session management
│   ├── models.py                        # Database tables & UserRole Enums
│   ├── schemas.py                       # Pydantic request/response validation
│   ├── security.py                      # Password hashing & JWT token handling
│   ├── test_auth.py                     # Authentication unit test suite
│   ├── routers/
│   │   └── auth.py                      # Login, Signup, and Profile endpoints
│   ├── requirements.txt                 # Backend Python dependencies
│   └── app.db                           # SQLite Database
│
├── Intelligent-Research(Gopi)/         # React Vite Frontend Application
│   └── Login/
│       ├── src/
│       │   ├── Pages/Login.jsx          # Login & Signup interactive interface
│       │   ├── App.jsx                  # Main application component
│       │   └── index.css                # Global styles & glassmorphism theme
│       ├── package.json                 # Frontend dependencies
│       └── vite.config.js               # Vite bundler configuration
│
└── README.md                            # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

---

### 1️⃣ Backend Setup (`/backend`)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   python main.py
   ```
   *The server will start on `http://127.0.0.1:8000`.*

5. **API Documentation**:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2️⃣ Frontend Setup (`/Intelligent-Research(Gopi)/Login`)

1. Navigate to the frontend login directory:
   ```bash
   cd Intelligent-Research(Gopi)/Login
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   *Access the web app at `http://localhost:5173`.*

---

## 🧪 Running Tests

To execute the backend test suite (covering authentication, user creation, JWT validation, and error handlers):

```bash
cd backend
pytest test_auth.py -v
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | API Health Check | ❌ |
| `POST` | `/api/v1/auth/signup` | Register a new user | ❌ |
| `POST` | `/api/v1/auth/login` | User login & JWT issuance | ❌ |
| `GET` | `/api/v1/auth/me` | Fetch current user profile | 🔒 Yes |

---

## 🗺️ Roadmap & Future Enhancements

- [ ] **AI Grant Recommender Engine**: Semantic matching using vector embeddings.
- [ ] **Patent Analytics Portal**: Interactive visual graphs for intellectual property tracking.
- [ ] **Research Collaboration Hub**: Team workspace for co-authoring funding proposals.
- [ ] **Third-Party API Integrations**: Direct sync with PubMed, Google Patents, and Grant databases.

---

## 📄 License

This project is created for research funding and innovation intelligence management. All rights reserved.