---
layout: home
permalink: index.html
repository-name: e22-co2060-bloodmsystem
title: HopeDrop - Blood Bank Management System
---

# HopeDrop - Blood Bank Management System

---

## 👥 Team (Group 50 - DevDynamos)
- **E/22/032**, Dulaj Ashen, [e22032@eng.pdn.ac.lk](mailto:e22032@eng.pdn.ac.lk)
- **E/22/203**, Hasara Weerawarna, [e22203@eng.pdn.ac.lk](mailto:e22203@eng.pdn.ac.lk)
- **E/22/269**, Sajith Kumara, [e22269@eng.pdn.ac.lk](mailto:e22269@eng.pdn.ac.lk)
- **E/22/353**, Gayasha Sandeepa, [e22353@eng.pdn.ac.lk](mailto:e22353@eng.pdn.ac.lk)

---

## 📑 Table of Contents
1. [Introduction & Problem Statement](#introduction--problem-statement)
2. [Proposed Solution](#proposed-solution)
3. [Key Features by Role](#key-features-by-role)
4. [System Architecture & Tech Stack](#system-architecture--tech-stack)
5. [Testing & Quality Assurance](#testing--quality-assurance)
6. [Live Deployment](#live-deployment)
7. [Links](#links)

---

## 📌 Introduction & Problem Statement

Blood transfusion is a life-saving intervention, yet blood supply chains in Sri Lanka and many developing healthcare ecosystems face severe logistical friction:
- **High Blood Wastage:** Lack of automated expiry tracking leads to critical units expiring on the shelf.
- **Emergency Delays:** Hospital doctors and emergency units lack real-time visibility into compatible blood stocks across neighboring hospitals.
- **Fragmented Management:** Manual paper-based tracking at blood donation camps creates delays in screening, blood transfer, and lab verification.

**HopeDrop** addresses these challenges by providing a unified, cloud-hosted digital platform connecting donors, blood camp organizers, hospital staff, medical officers, and national administrators into a single real-time network.

---

## 💡 Proposed Solution

HopeDrop replaces fragmented paper logs with an automated digital workflow:
- **Automated Donor Lifecycle:** Real-time eligibility calculator enforcing the 90-day Sri Lanka NBTS donation gap, personalized QR codes for camp check-in, and digital donation certificates.
- **Camp-to-Hospital Supply Tracking:** End-to-end custody tracking of blood units from donation at mobile camps through transit to hospital blood bank intake.
- **4-Stage Inventory Governance:** Multi-stage quality control approvals before newly received or adjusted blood stock is added to active inventory.
- **Emergency Priority Requests:** Multi-level urgency requests (Normal, High, Critical) with automated hospital inventory deductions upon fulfillment.
- **Predictive Expiry Alerts:** Daily automated background monitors flagging units nearing expiry ($\le 7$ days) and critical expiry ($\le 3$ days).

---

## 🔑 Key Features by Role

| Role | Key Capabilities |
| :--- | :--- |
| **🩸 Blood Donor** | Sign up, personalized QR pass, NBTS 90-day eligibility tracker, camp registration, donation history, and urgent alerts. |
| **🏥 Medical Officer (Doctor)** | Submit urgent & routine blood requests, track real-time fulfillment status, and monitor local hospital stock. |
| **⛺ Camp Organizer** | Schedule camps, scan donor QR codes at registration, manage pre-donation medical screening, and dispatch collections. |
| **🔬 Inventory Officer** | Receive in-transit blood collections from camps, perform lab quality verification, and execute stock adjustments. |
| **👑 System Administrator** | National cross-hospital inventory dashboard, hospital & staff management, and system-wide audit analytics. |

---

## 🏗️ System Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────┐
   │              React 19 + Vite 7 (Vercel)                │
   │   TailwindCSS • Recharts • Leaflet Maps • Lucide Icons │
   └──────────────────────────┬─────────────────────────────┘
                              │ REST API (JSON / JWT)
   ┌──────────────────────────▼─────────────────────────────┐
   │            Django 5.2 + DRF 3.16 (Render)              │
   │  SimpleJWT (Rotation & Blacklist) • WhiteNoise • Brevo │
   └──────────────────────────┬─────────────────────────────┘
                              │ SSL Encrypted TCP
   ┌──────────────────────────▼─────────────────────────────┐
   │          Neon Serverless PostgreSQL (Cloud)            │
   │          Automated migrations • Pooled Compute         │
   └────────────────────────────────────────────────────────┘
```

- **Frontend:** React 19, Vite 7, React Router DOM v7, Axios, TailwindCSS, Recharts, Leaflet.
- **Backend:** Python 3.11, Django 5.2, Django REST Framework, SimpleJWT, Gunicorn, WhiteNoise.
- **Database:** Serverless PostgreSQL on **Neon** (Production) / SQLite (Local Dev).
- **Hosting:** **Vercel** (Frontend SPA) + **Render** (Backend WSGI Service).

---

## 🧪 Testing & Quality Assurance

The platform includes an automated testing suite verifying data integrity, cryptographic authentication, and role authorization:

```bash
python manage.py test apps.UserAuth apps.blood.bloodinventor apps.donor apps.medicalOfficers apps.adminDashboard
```

- **Unit Testing (16 Tests):** Validates Sri Lanka NIC regex (12-digit & 9-digit+V/X formats), NBTS 90-day donation interval calculations, and stock threshold logic.
- **Integration Testing (12 Tests):** Validates user registration, JWT token rotation, token blacklisting on logout, and camp donation state machines.
- **Security / RBAC Testing (6 Tests):** Verifies role boundaries, preventing donors or unauthenticated users from accessing national dashboards or admin statistics.
- **Result:** **34 / 34 Tests Passing (100% pass rate).**

---

## 🌐 Live Deployment

- **Live Application:** [https://e22-co2060-bloodmsystem-one.vercel.app](https://e22-co2060-bloodmsystem-one.vercel.app)
- **API Base URL:** `https://hopedrop-backend.onrender.com/api/v1`

---

## 🔗 Links

- [GitHub Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/){:target="_blank"}
- [Faculty of Engineering, University of Peradeniya](https://eng.pdn.ac.lk/){:target="_blank"}
