# HopeDrop - Blood Bank Management System

HopeDrop is a comprehensive full-stack Blood Bank Management and Donation Tracking System designed for donors, medical officers, blood camp organizers, inventory officers, and national administrators.

---

## 🌟 Tech Stack

- **Backend:** Python 3.11, Django 5.2, Django REST Framework, SimpleJWT, WhiteNoise
- **Frontend:** React 19, Vite, TailwindCSS, Axios, Recharts, Lucide Icons, Leaflet Maps
- **Database:** PostgreSQL (Neon Serverless in Production) / SQLite (Local development)
- **Deployment:** Render (Backend API) + Vercel (Frontend SPA)

---

## 📁 Repository Structure

```text
├── backEnd/
│   └── main/                 # Django backend root (manage.py, config/, apps/)
│       ├── apps/             # Modular Django apps (UserAuth, donor, blood, medicalOfficers, adminDashboard)
│       ├── config/           # Django project settings and root urls
│       └── requirements.txt  # Python production dependencies
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── api/              # Axios service modules
│   │   ├── components/       # Shared UI and Layout components
│   │   ├── context/          # Auth and global contexts
│   │   └── pages/            # Role-specific dashboard & public pages
│   └── vercel.json           # Vercel SPA rewrite rules
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Backend Setup
1. Open a terminal and navigate to the Django root:
   ```bash
   cd backEnd/main
   ```
2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. (Optional) Seed demo accounts for all roles:
   ```bash
   python seed_demo_accounts.py
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```
   Backend will run on `http://127.0.0.1:8000`.

---

### 2. Frontend Setup
1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL=http://localhost:8000/api/v1`.
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`.

---

## 🌐 Production Deployment

- **Backend (Render):**
  - **Root Directory:** `backEnd/main`
  - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
  - **Start Command:** `gunicorn config.wsgi:application`
  - **Key Env Vars:** `DEBUG=False`, `DJANGO_SECRET_KEY=...`, `DATABASE_URL=...` (from Neon DB), `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`

- **Frontend (Vercel):**
  - **Root Directory:** `frontend`
  - **Framework Preset:** Vite
  - **Environment Variable:** `VITE_API_URL=https://your-backend.onrender.com/api/v1`
