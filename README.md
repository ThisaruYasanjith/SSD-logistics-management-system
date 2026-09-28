# GrocerEase Lanka – Logistics Management System

A secure full-stack logistics and warehouse management web application designed for efficient handling of staff, inventory, suppliers, delivery vehicles, and warehouse operations in a grocery logistics environment.

> Built with the **MERN Stack** – MongoDB, Express.js, React (Vite), and Node.js  
> Backend: **TypeScript** | Frontend: **JavaScript (React 19)** | Authentication: **JWT + OAuth 2.0 / OpenID Connect (Google Auth)** | File Uploads: **Cloudinary**

---

## 📌 Repository Information

### 1. GROUP MEMBERS
- Member 1 Name: Maddumahewa T.Y. | Student ID: IT23183636
- Member 2 Name: Perera K.M.A | Student ID: IT23201750
- Member 3 Name: Jayalal G.M.S.B | Student ID: IT23177482
- Member 4 Name: A.A Abitharshan | Student ID: IT23393516

### 2. ORIGINAL PROJECT REPOSITORY
- **Original GitHub URL**: https://github.com/dulsara30/logistics-management-system
- **Source Reference & Attribution**: Forked and adapted from the original open-source Logistics Management System developed by **dulsara30** and contributors. All original codebase design, baseline architecture, and baseline assets are credited to the original authors. This repository has been hardened, refactored, and extended with vulnerability remediations and OAuth 2.0 / OpenID Connect authentication as part of our Secure Software Development (SSD) coursework.

### 3. VIDEO DEMONSTRATION
- **YouTube Link**: [https://youtu.be/...]


## 🚀 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack & Security](#-tech-stack--security)
- [System Roles & RBAC](#-system-roles--rbac)
- [Project Structure](#-project-structure)
- [Setup & Running Instructions](#-setup--running-instructions)
- [System Modules & Scope](#-system-modules--scope)

---

## 🔍 Overview

**GrocerEase Lanka** is a comprehensive logistics management platform tailored for grocery distribution companies. It provides end-to-end functionalities including staff management, warehouse monitoring, delivery tracking, supplier handling, vehicle fleet management, and real-time analytics.

The system has been hardened following **Secure Software Development (SSD)** standards, incorporating vulnerability mitigations across authentication, authorization, input validation, and data protection, along with **OAuth 2.0 / OpenID Connect (Google Identity)** integration.

---

## ✨ Key Features

### 1. 🔐 Authentication & OAuth 2.0 / OpenID Connect
- Dual authentication mode: Local credentials & Google OpenID Connect (SSO)
- Secure session handling via `HttpOnly`, `SameSite=Strict`, and `Secure` JWT cookies
- Cryptographic ID token verification server-side using Google's public JWKS certificates
- Comprehensive security audit logging for all authentication attempts

### 2. 🏭 Warehouse Management
- Add, update, and delete warehouses
- Real-time capacity monitoring and zone allocation
- Maintenance scheduling and routing tracking
- Assign/revoke warehouse manager roles

### 3. 📦 Inventory Management
- CRUD operations for inventory items with strict RBAC
- Real-time stock tracking and stockout operations
- Reorder threshold alerts and low-stock notifications
- Categorization by type, supplier, and location

### 4. 🚚 Vehicle Fleet & Delivery Management
- Vehicle and driver registration with profile management
- Delivery scheduling with route management
- Driver dashboards with assigned delivery tasks
- Maintenance records and status tracking

### 5. 👥 Staff Management
- Staff member lifecycle management (Add, Update, Manage)
- Attendance tracking with QR Code generation/scanning
- Leave request workflow and salary management
- Fine-grained Role-Based Access Control (RBAC)

### 6. 🧾 Supplier & Return/Damage Handling
- Supplier profile and contract management
- Return and damage report handling with photo uploads
- Formal return dispatch reports and analytics

---

## 🛠 Tech Stack & Security

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, `@react-oauth/google`
- **Backend**: Node.js, Express.js (TypeScript), `google-auth-library`
- **Database**: MongoDB & Mongoose
- **Security Middleware**: Helmet (CSP, framing protection), Express Rate Limit (DDoS/brute-force defense), Cookie-Parser
- **Authentication**: JSON Web Tokens (JWT), BCrypt password hashing, Google OpenID Connect
- **Cloud Storage**: Cloudinary (Secure document & photo attachments)

---

## 👥 System Roles & RBAC

| Role | Access Scope & Permissions |
| :--- | :--- |
| **Business Owner** | Full administrative control, system analytics, financial & operational reporting |
| **Warehouse Manager** | Warehouse operations, inventory controls, delivery dispatch, and supplier management |
| **Inventory Manager** | Inventory item management, stockouts, damage/return reporting |
| **Driver** | Assigned delivery tasks, route profiles, delivery status updates |
| **Maintenance Staff** | Vehicle and warehouse maintenance requests and updates |
| **Other Staff** | Staff self-service portal (attendance, QR code, leave requests, profile) |

---

## 📁 Project Structure

```bash
SSD-LOGISTICS-MANAGEMENT-SYSTEM/
│
├── backend/                             # Backend API (Node.js + Express + TypeScript)
│   ├── .env                             # Environment variables
│   ├── .env.example                     # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── API/                         # Route handlers & controllers
│       │   ├── DeliveryScheduling/
│       │   ├── Maintenance/
│       │   ├── Return and DamageHandling/
│       │   ├── RoutingMaintenance/
│       │   ├── SpplierManagement/
│       │   ├── StaffManagement/
│       │   ├── VehicleFleet/
│       │   ├── WarehouseManagement/
│       │   └── login/
│       ├── Application/                 # Business logic & domain services
│       ├── Infrastructure/              # Database models, schemas & connection
│       │   └── schemas/
│       ├── middleware/                  # Auth, RBAC & security middleware
│       ├── types/                       # TypeScript declarations
│       ├── utils/                       # JWT, helper utilities & tokens
│       ├── seed.ts                      # Database auto-seeding
│       └── index.ts                     # Express application entry point
│
├── frontend/                            # Frontend SPA (React 19 + Vite)
│   ├── .env                             # Frontend environment variables
│   ├── .env.example                     # Frontend environment template
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── assets/                      # Static assets & images
│       ├── component/                   # Reusable UI components & layouts
│       ├── layouts/                     # Root and Staff layout wrappers
│       ├── pages/                       # Feature page modules
│       │   ├── DeliveryScheduling/
│       │   ├── Help/
│       │   ├── Home/
│       │   ├── InventoryManagement/
│       │   ├── Return and DamageHandling/
│       │   ├── StaffManagement/
│       │   ├── StaffMember/
│       │   ├── SupplierManagement/
│       │   ├── VehicleFleet/
│       │   ├── WarehouseManagement/
│       │   └── login/
│       ├── utils/                       # API client (Axios) & helpers
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx                     # Application root & Router configuration
│
├── README.md                            # Project documentation
└── package.json
```

---

## ⚙️ Setup & Running Instructions

### Prerequisites

* **Node.js** (v18.x or higher) and **npm**
* **MongoDB** (Local instance or MongoDB Atlas cluster)
* **Google Cloud Console Account** (OAuth 2.0 Client ID for Google Sign-In)

---

### 1. Environment Configuration

#### Backend Configuration
Create `backend/.env`:
```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=1d
JWT_TTL_MS=86400000

# Cloudinary (Optional / Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth 2.0 / OpenID Connect
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### Frontend Configuration
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

### 2. Installation & Running

#### Start the Backend Server:
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:8000`.*

#### Start the Frontend Client:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 👨‍💻 System Modules & Scope

| Module | Features & Scope |
| :--- | :--- |
| **Authentication & OIDC** | Passwordless Google SSO, credential login, HttpOnly sessions, Audit logging |
| **Staff Management & Self-Service** | Staff CRUD, attendance tracking via QR codes, leave workflows, salary calculation |
| **Fleet & Delivery Management** | Vehicle profiles, driver assignments, route dispatching, vehicle maintenance |
| **Warehouse Management** | Warehouse capacity, temperature zones, manager assignments, maintenance tracking |
| **Inventory Management** | Stock tracking, threshold alerts, stockout verification, categorization |
| **Supplier & Damage Handling** | Supplier directory, damage reports with attachments, formal return dispatches |
