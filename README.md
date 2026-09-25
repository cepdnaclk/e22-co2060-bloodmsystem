# 🩸 DevDynamos Blood Bank Application

## 🧩 Project Overview
The Blood Bank Application helps **donors, medical staff, and administrators** efficiently manage blood donations and emergencies. Features include **donor eligibility checks, donation scheduling, inventory tracking, and location-based matching for emergencies**.

## 🏗️ Feature in our system

<details>
<summary>Donor Portal</summary>

- Personalized dashboard and donation stats 
- Eligibility quiz with interactive logic  
- Donation history with status badges  
- Printable digital certificates  
- Camp/Hospital locator (maps)  
- Appointment booking with QR code confirmation  
- Profile management (contact info, password, address) 

</details>

<details>
<summary>Medical Staff Portal</summary>

- Analytics dashboard for donor and inventory metrics  
- Donor search and verification  
- Donation record entry (vitals, blood bag info)  
- Inventory management with filters

</details>

<details>
<summary>Admin & Camp Host</summary>

- Camp organization and tracking  
- Volunteer list management  
- Blood request and stock transfer handling  
- User approval and management

</details>

<details>
<summary>Special Features</summary>

- Location-based donor matching (latitude/longitude-based)  
- Automated SMS/Email notifications  
- Mobile responsiveness across all pages  

</details>
<details>
<summary>Tech stack/summary>

-frontend-React
-backend-Django with python
-database-postgreSql

</details>

---

## Tech Stack
- **Frontend**: React
- **Backend**: Django with Python
- **Database**: PostgreSQL
- **Maps Integration**: Google Maps API / Leaflet.js
- **Notifications**: SMS & Email services (Twilio / SendGrid)

## 🗂️ Project Workflow

```mermaid
graph LR
A[Project Initialization] --> B[Donor Interface]
B --> C[Donor Interaction & Maps]
C --> D[Medical Staff Portal]
D --> E[Camp Host & Admin]
E --> F[Admin Power Features]
F --> G[Special Features & Polishing]
