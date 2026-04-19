# 🌿 Coinbird — The Budgeting App

A full-stack personal budgeting web app.

---

## 🗂️ Project Structure

```
coinbird/
├── backend/          # Python FastAPI
│   ├── routers/
│   ├── core/
│   ├── db/
│   ├── main.py
│   └── requirements.txt
└── frontend/         # Next.js 14 + Tailwind CSS
    ├── app/          ← Pages (Next.js App Router)
    ├── components/
    └── lib/
```

---

## ⚡ Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### 2. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE coinbird;
\q

# Run the setup script
psql -U postgres -d coinbird -f backend/db_setup.sql
```

---

### 3. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and set your DATABASE_URL:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/coinbird
# JWT_SECRET=pick_a_long_random_string

# Start the server
uvicorn main:app --reload --port 8000
# → Runs on http://localhost:8000, API docs at http://localhost:8000/docs
```

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start the dev server
npm run dev
# → Runs on http://localhost:3000
```

---

### 5. Open the App

Visit **http://localhost:3000**

- Register a new account
- You'll be automatically redirected to the Dashboard

---

## 🔑 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Sign in |
| GET  | /auth/me | Get current user |

### Transactions
| Method | Path | Description |
|--------|------|-------------|
| GET  | /transactions | List transactions |
| POST | /transactions | Create transaction |
| PUT  | /transactions/:id | Update transaction |
| DELETE | /transactions/:id | Delete transaction |
| GET  | /transactions/summary | Dashboard stats |

### Budget
| Method | Path | Description |
|--------|------|-------------|
| GET  | /budget | List budgets for month |
| POST | /budget | Create/update budget |
| DELETE | /budget/:id | Remove budget |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET  | /categories | List categories |
| POST | /categories | Create category |
| DELETE | /categories/:id | Delete custom category |

### Users
| Method | Path | Description |
|--------|------|-------------|
| PUT  | /users/profile | Update profile |
| PUT  | /users/settings | Update settings |
| GET  | /users/savings-goals | List goals |
| POST | /users/savings-goals | Create goal |

---

## 🎨 Pages

| Route | Page |
|-------|------|
| `/login` | Login / Register |
| `/dashboard` | Overview, balance, recent transactions |
| `/transactions` | Full transaction list with add/edit/delete |
| `/budget` | Monthly category budgets |
| `/reports` | Charts and spending analysis |
| `/profile` | User info editor |
| `/settings` | Currency, theme, timezone |

---

## 🌱 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Recharts
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL (asyncpg)
- **Auth**: JWT (python-jose + passlib)
- **Validation**: Pydantic

---

## 🚀 Production Build

```bash
# Frontend
cd frontend && npm run build && npm start

# Backend
cd backend && uvicorn main:app
```

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL in production.
