# 🌱 AgriLink: Smart Agricultural Supply Chain & Emergency Storage Platform

AgriLink is a climate-smart B2B platform designed to solve crop distribution issues, post-harvest losses, and middleman monopolies. By directly connecting **Farmers**, **Cold Storage Providers**, and **Distributors** via real-time mapping and emergency notifications, AgriLink protects agricultural yields from sudden natural disasters (floods, storms, extreme weather) and market crashes.

---

## 🚀 Key Features

### 👨🌾 Farmer Module
- **Crop Uploads**: List crop yield parameters (crop type, quantity in kg, price per kg, expected storage duration, and select coordinates directly from the map).
- **Storage Submissions**: View local cold storage facilities, check distance/pricing, and submit reservation requests.
- **B2B Sourcing Sales**: Receive direct buying requests and coordinate instant reservations from distributors, bypassing unfair intermediaries.

### ❄️ Cold Storage Module
- **Capacity Management**: Update facility capacity parameters (total, occupied, and free space) in real-time.
- **Request Dashboard**: Review incoming farmer requests to accept/reject bookings (which automatically updates availability parameters).
- **Dynamic Pricing Controls**: Minimized empty facility space during off-peak windows via custom dynamic discount sliders.

### 🚚 Distributor Module
- **Advanced Sourcing Filters**: Filter available crops by type, minimum quantity, and geographic radius.
- **Direct B2B Reservations**: Skip middlemen to source and secure farm produce directly from farmers.
- **Interactive Sourcing Map**: Browse regional crop supplies and view distance metrics on a unified maps layer.

### 🚨 Emergency Support System
- **Disaster Relocation Routing**: Automated geospatial routing to find the nearest cold storage facilities with matching free capacity during emergencies.
- **Weather Hazard Simulation**: Control console to trigger simulated weather warning zones (floods, storms) that broadcast real-time alarms to farmers in affected grids.
- **Pulsing Evacuation Tracks**: Real-time visual route paths mapping the safest transit lines from farms to emergency storage nodes.

---

## ⚙️ Getting Started & Local Setup

### Prerequisites
- **Node.js** (v18+ recommended)

### Step 1: Start the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Start the Express server:
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:5000` and initializes the local database file `backend/data/db.json` automatically.*

### Step 2: Start the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser to view the application.*

---

## 🔑 Demo Access Credentials

To test role interactions without registering new accounts, use these pre-seeded profiles:

| Role | Username / Email | Password | Coordinates / Area |
| :--- | :--- | :--- | :--- |
| **Farmer (Rajesh)** | `rajesh@farmer.com` | `password` | Singur, West Bengal (`22.8251`, `88.3902`) |
| **Cold Storage (Himachal)** | `himachal@storage.com` | `password` | Shimla, HP (`31.1048`, `77.1734`) |
| **Distributor (Aman)** | `aman@distributor.com` | `password` | Kolkata, West Bengal (`22.5726`, `88.3639`) |

*Or click any of the **Quick Access Gateway** buttons on the landing page to sign in instantly.*

---

## 🧪 Simulation Testing Walkthrough

1. Open **Window A** and log in as **Farmer (Rajesh)**.
2. Open **Window B** in incognito mode, log in as **Distributor (Aman)**, and open the **Disaster Simulator** tab on the sidebar.
3. In **Window B**, select **🌧️ Flash Flood** as the disaster vector, keep the location centered near Rajesh (`22.8251`, `88.3902`), and click **Broadcast Simulated Emergency**.
4. Switch to **Window A**: A red hazard warning will flash on Rajesh's screen in real-time, and his map will render a red circle around his coordinates.
5. In the **Emergency Evacuation** tab on **Window A**, select Rajesh's crop. The system will plot a pulsing transit line showing routing options to the closest safe cold storage. Click **Evacuate** to secure the crop.
