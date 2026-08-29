# Intelligent Research: AI-Powered Funding & Innovation Intelligence Platform

> An AI-driven platform for research funding discovery, patent analysis, technology intelligence, and commercialization insights.

## 📌 Project Overview

**Intelligent Research** is a platform designed to help researchers, startup founders, innovation managers, and administrators discover research funding opportunities, manage research information, analyze patents and publications, and support innovation and commercialization activities.

The project is being developed incrementally through multiple milestones.

## ✨ Key Features

- **User Authentication & Authorization**
  - User registration and login
  - Secure password hashing
  - JWT-based authentication
  - OAuth2 password flow
  - Role-Based Access Control (RBAC)
  - Protected APIs
  - Current-user profile management

- **Research Profile Management**
  - Research domains and interests
  - Technology areas
  - Publications
  - Patents

- **Innovation Intelligence**
  - Funding opportunity discovery
  - Patent and technology intelligence
  - Innovation insights
  - Commercialization support

## 👥 User Roles

| Role | Description |
| :--- | :--- |
| **Researcher** | Manage research profile, publications, patents and discover funding opportunities |
| **Startup Founder** | Explore innovation opportunities and funding |
| **Innovation Manager** | Manage innovation and technology-related information |
| **Administrator** | Manage users, authorization and platform administration |

## 🛠️ Technology Stack

### Backend

- **Framework:** FastAPI
- **Language:** Python 3.10+
- **Database:** SQLite / SQLAlchemy
- **ORM:** SQLAlchemy 2.0
- **Data Validation:** Pydantic v2
- **Authentication:** JWT
- **Authorization:** Role-Based Access Control (RBAC)
- **Password Hashing:** Passlib / bcrypt
- **OAuth2:** OAuth2 Password Flow
- **Testing:** Pytest / HTTPX
- **Migration:** Alembic

### Frontend

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** CSS
- **Authentication State:** React Context
- **Routing:** React Router

