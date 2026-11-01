# 🎓 AI-Assisted Campus Resource & Grievance Management Platform

An intelligent, multi-tier web application built to streamline student complaints, automatically classify grievances using AI, prioritize urgency, and orchestrate departmental resolution workflows.

---

## 🏗️ Architecture & Technology Stack

1. **Frontend**: React.js (Single Page Application with role-based UI and live AI typing analysis).
2. **Backend**: Node.js & Express REST API with JWT role-based access control.
3. **Database**: MongoDB with Mongoose (with self-contained in-memory fallback for immediate zero-config demoing).
4. **AI Microservice**: Python Flask microservice using scikit-learn (TF-IDF vectorizer + Naive Bayes/Heuristic scoring) to infer grievance category and priority.

```
                           +------------------------+
                           |  React.js Frontend     |
                           |  (Student/Staff/Admin) |
                           +-----------+------------+
                                       | HTTP / REST (JWT)
                                       v
                           +------------------------+
                           |  Node.js Express API   |
                           +-----+------------+-----+
                                 |            |
             In-Memory / MongoDB |            | Internal / REST
                                 v            v
                      +--------------+    +-----------------------+
                      | Mongoose DB  |    | Python AI Microservice|
                      | Models       |    | (Flask + Scikit-Learn)|
                      +--------------+    +-----------------------+
```

---

## 👥 User Roles & Access Rights

| Role | Permissions & Flow | Default Demo Account |
| :--- | :--- | :--- |
| **Student** | Submits grievances, views unique grievance IDs (`GRV-2026-XXXXX`), tracks real-time status progression, views audit logs. | `student@campus.edu` (pw: `password123`) |
| **Department Staff** | Views tickets filtered to their department, transitions status (`In Progress` $\rightarrow$ `Resolved`), attaches resolution notes. | `staff@campus.edu` (pw: `password123`) |
| **Administrator** | Accesses campus-wide analytics, category distribution, overrides priorities, delegates tickets to specific staff. | `admin@campus.edu` (pw: `password123`) |

---

## 🔄 Grievance Lifecycle Status Flow

```
[ Submitted ] 
      ↓
[ Pending Review ] (AI Categorized & Prioritized)
      ↓
[ Assigned ] (Delegated to Staff / Department)
      ↓
[ In Progress ] (Action Initiated)
      ↓
[ Resolved ] (Resolution Notes Submitted)
      ↓
[ Closed ] (Archived)
```

---

## ⚡ Quick Start Guide

### 1. Start the Backend Server (Port 5000)
```bash
cd backend
npm install
npm start
```
*Note: The backend connects to MongoDB if running locally at `mongodb://localhost:27017/campus_grievance_db`. If MongoDB is not running, it automatically operates in resilient zero-setup in-memory mode.*

### 2. Start the AI Microservice (Port 5001)
```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

### 3. Start the Frontend (Port 3000)
```bash
cd frontend
npm install
npm start
```

Visit **`http://localhost:3000`** in your browser. Use the top banner buttons to switch seamlessly between **Student**, **Staff**, and **Admin** personas.

---

## 📡 Core API Reference

- `POST /api/auth/login`: Authenticate and receive signed JWT.
- `GET /api/auth/demo-users`: Retrieve pre-configured demo user accounts.
- `POST /api/grievances`: Create grievance (triggers AI classification).
- `GET /api/grievances`: Retrieve grievances scoped to authenticated role.
- `PATCH /api/grievances/:id/status`: Transition grievance status.
- `PATCH /api/grievances/:id/assign`: Admin assignment of grievance to staff.
- `PATCH /api/grievances/:id/priority`: Admin override of AI priority with reason.
- `POST /api/grievances/:id/resolution`: Submit resolution notes.
- `GET /api/analytics/dashboard`: Fetch category counts and department metrics.
- `POST http://localhost:5001/predict`: AI microservice categorization endpoint.
