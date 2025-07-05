# GrocerEase Lanka – Logistics Management System

A full-stack logistics and warehouse management web application designed for efficient handling of staff, inventory, suppliers, delivery vehicles, and warehouse operations in a grocery logistics environment.

> Built with the **MERN Stack** – MongoDB, Express.js, React, and Node.js  
> Backend: **TypeScript** | Frontend: **JavaScript** | File Uploads via **Cloudinary**

---

## 🚀 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Roles](#-system-roles)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Team Contributions](#-team-contributions)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🔍 Overview

**GrocerEase Lanka** is a comprehensive logistics management platform tailored for grocery distribution companies. It provides end-to-end functionalities including staff management, warehouse monitoring, delivery tracking, supplier handling, vehicle fleet management, and real-time analytics.

The system was developed as a group project in the second semester of our second year at **SLIIT**, as part of the **IT2080 – IT Project** course.

---

## ✨ Key Features

### 1. 🏭 Warehouse Management
- Add, update, and delete warehouses
- Real-time capacity monitoring
- Maintenance scheduling and tracking
- Assign/revoke warehouse manager roles
- Maintenance staff notification system

### 2. 📦 Inventory Management
- CRUD operations for inventory items
- Real-time stock tracking
- Reorder threshold alerts and low-stock notifications
- Categorization by type, supplier, and location
- Inventory reporting (daily, weekly, monthly)

### 3. 🚚 Vehicle Fleet & Delivery Management
- Vehicle and driver registration
- Delivery scheduling with route optimization
- Driver dashboards with assigned delivery tasks
- Status updates: In Transit, Delivered, Failed, etc.
- Monthly fuel and maintenance reporting

### 4. 👥 Staff Management
- Add, update, and delete staff members
- Attendance tracking and leave requests
- Role-based access control for various personas
- Monthly salary calculation and deposit notifications
- Login/dashboard access for staff and managers

### 5. 🧾 Supplier & Return/Damage Management
- Supplier CRUD and management
- Logging of returned/damaged items with document upload
- Notifications to and from suppliers
- Reporting on return/damage incidents and analytics

---

## 🛠 Tech Stack

- **Frontend**: React.js (JavaScript)
- **Backend**: Node.js, Express.js (TypeScript)
- **Database**: MongoDB (NoSQL)
- **Authentication**: JWT, Role-Based Access Control
- **File Uploads**: Cloudinary
- **Project Management**: Trello (Kanban board), Agile Sprints

---

## 👥 System Roles

- **Business Owner**: Full control, system analytics, cost insights
- **Warehouse Manager**: Staff, warehouse, delivery, and supplier operations
- **Inventory Manager**: Manages inventory items and stock levels
- **Driver**: Receives and updates delivery tasks
- **Staff Member**: Handles assigned tasks, attendance, salaries
- **Maintenance Staff**: Responds to scheduled maintenance requests

---

## 📁 Project Structure

```bash
LOGISTICS-MANAGEMENT-SYSTEM/
│
├── backend/                 # Backend - Node.js + TypeScript
│   ├── .env
│   └── src/
│       ├── API/
│       ├── Application/
│       ├── Infrastructure/
│       ├── middlewares/
│       ├── types/
│       ├── util/
│       └── index.ts
│
├── frontend/                # Frontend - React
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       └── main.js
│
├── README.md
└── package.json
````

---

## ⚙️ Setup Instructions

### Prerequisites

* Node.js and npm
* MongoDB (local or MongoDB Atlas)
* Cloudinary account (for image/file uploads)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/dulsara30/logistics-management-system.git
cd LOGISTICS-MANAGEMENT-SYSTEM
```

2. **Set up environment variables**

Create `.env` files in both `frontend/` and `backend/` directories:

```env
# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
```

3. **Install dependencies**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

4. **Run the application**

```bash
# Backend
npm run dev

# Frontend
cd ../frontend
npm start
```

---

## 👨‍💻 Team Contributions

| Name                      |  Models                           | GitHub Username                |
| ------------------------- | --------------------------------- | ------------------------------ |
| **Paranagama P.W\.K.D.M** | Staff Management, Auth            | [@dulsara30](#)                |
| **Maddumahewa T.Y**       | Fleet & Delivery Management       | [@ThisaruYasanjith](#)         |
| **H.D.K Ariyadasa**       | Warehouse Management              | [@dilani365](#)                |
| **Liyanaarachchi K**      | Inventory Management              | [@Kavindya-Liyanaarachchi](#)  |
| **Malshani J.P.J**        | Supplier & Return/Damage Handling | [@Janeesha532](#)              |


---

## 📄 License

This project is intended for **academic use only** as part of SLIIT coursework.
All rights reserved © 2025 by the original authors.

---

## ⭐ Acknowledgments

* **SLIIT** – BSc (Hons) in Information Technology – Year 2, Semester II
* Lecturers, mentors, and project advisors
* The open-source community for libraries and inspiration
