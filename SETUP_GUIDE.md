# Paint Center Pro - Setup & Installation Guide

This guide will help you install and run the **Paint Center Sales and Inventory Management System** on a new computer.

## 1. Prerequisites

Before installing, ensure the new computer has the following:
*   **Node.js (v18 or higher):** Download and install from [nodejs.org](https://nodejs.org/). This will also install `npm` (Node Package Manager).
*   **Internet Access:** Required for the initial installation of dependencies.

## 2. Installation Steps

### Step A: Copy the Project Files
Transfer the `Paint Center` folder to the new computer (e.g., via USB drive or Git).

### Step B: Install Backend Dependencies
1.  Open a terminal (Command Prompt, PowerShell, or Terminal).
2.  Navigate to the `backend` folder:
    ```bash
    cd "Path/To/Paint Center/backend"
    ```
3.  Install the required packages:
    ```bash
    npm install
    ```
4.  Initialize the database:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```
5.  Seed the admin user:
    ```bash
    node scripts/seed-admin.js
    ```

### Step C: Install Frontend Dependencies
1.  Navigate to the `frontend` folder:
    ```bash
    cd "../frontend"
    ```
2.  Install the packages:
    ```bash
    npm install
    ```

---

## 3. How to Run the Application

You must run **both** the backend and the frontend at the same time.

### 1. Start the Backend
In a terminal, go to the `backend` folder and run:
```bash
node index.js
```
*You should see: "Server running on port 3000"*

### 2. Start the Frontend
In a **separate** terminal window, go to the `frontend` folder and run:
```bash
npm run dev
```
*You should see a link like: http://localhost:5173*

## 4. Accessing the System
Open your web browser and go to [http://localhost:5173](http://localhost:5173).

**Default Credentials:**
*   **Username:** `admin`
*   **Password:** `password123`

---

## Troubleshooting

*   **Port 3000 is occupied:** If you see an error saying the port is in use, make sure you don't have another instance of the backend running.
*   **Database Errors:** Ensure you have run `npx prisma generate` after installing dependencies.
