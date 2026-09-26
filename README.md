# HopeDrop - Blood Bank Management System

HopeDrop is a comprehensive full-stack Blood Bank Management and Donation Tracking System designed for blood donors, medical officers, blood camp organizers, hospital inventory officers, and national administrators in Sri Lanka.

---

## 🌐 Live Cloud Deployment

- **Live Web Application:** [https://e22-co2060-bloodmsystem-one.vercel.app](https://e22-co2060-bloodmsystem-one.vercel.app)
- **Live API Endpoint:** `https://hopedrop-backend.onrender.com/api/v1`



---

## 🌟 Tech Stack

- **Backend:** Python 3.11, Django 5.2, Django REST Framework, SimpleJWT, WhiteNoise, Gunicorn
- **Frontend:** React 19, Vite, TailwindCSS, Axios, Recharts, Lucide Icons, Leaflet Maps
- **Database:** PostgreSQL (Neon Serverless in Production) / SQLite (Local development)
- **Hosting & Infra:** Render (Backend Web Service) + Vercel (Frontend SPA) + Neon (Serverless Postgres)

---

## 📁 Repository Structure

```text
├── backEnd/
│   └── main/                 # Django backend root (manage.py, config/, apps/)
│       ├── apps/             # Modular Django apps
│       │   ├── UserAuth/     # Custom User model, JWT authentication, Profiles
│       │   ├── blood/        # Blood inventory, expiry alerts, 4-stage approvals
│       │   ├── donor/        # Donor details, blood camps, QR check-in
│       │   ├── medicalOfficers/ # Doctor profiles & blood requests
│       │   └── adminDashboard/  # National stats & administrative controls
│       ├── config/           # Django settings, URLs, WSGI
│       └── requirements.txt  # Python production dependencies
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── api/              # Axios service modules & RoleRoute guards
│   │   ├── components/       # Shared UI and Layout components
│   │   ├── context/          # Auth and global contexts
│   │   └── pages/            # Role-specific dashboards & public pages
│   └── vercel.json           # Vercel SPA rewrite rules
├── docs/                     # GitHub Pages Jekyll documentation site
└── README.md
```

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive 34-test suite covering Unit, Integration, and RBAC security:

```bash
# Run all automated tests from backEnd/main:
cd backEnd/main
python manage.py test apps.UserAuth apps.blood.bloodinventor apps.donor apps.medicalOfficers apps.adminDashboard
```

**Test Coverage Highlights:**
- **Unit Testing (16 Tests):** Validates Sri Lanka NIC formats (12-digit & 9-digit+V/X), NBTS 90-day donation interval calculations, and stock threshold logic.
- **Integration Testing (12 Tests):** Validates user registration, JWT token rotation, token blacklisting on logout, and camp donation state machines.
- **Security / RBAC (6 Tests):** Role-Based Access Control enforcing role boundaries on national inventory and administrative endpoints.
- **Pass Rate:** **34 / 34 (100% Passed)**

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

## 🌐 Production Deployment Architecture

- **Backend (Render):**
  - **Root Directory:** `backEnd/main`
  - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
  - **Start Command:** `gunicorn config.wsgi:application`
  - **Key Env Vars:** `DEBUG=False`, `DJANGO_SECRET_KEY=...`, `DATABASE_URL=...` (from Neon DB), `CORS_ALLOW_ALL_ORIGINS=False`

- **Frontend (Vercel):**
  - **Root Directory:** `frontend`
  - **Framework Preset:** Vite
  - **Environment Variable:** `VITE_API_URL=https://hopedrop-backend.onrender.com/api/v1`
