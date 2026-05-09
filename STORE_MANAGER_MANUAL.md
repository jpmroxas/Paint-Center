# 🖌️ Paint Center ERP - Store Manager Manual

Welcome to your production-ready Paint Center Management System! This document contains everything you need to manage the store, handle disasters, and move the system to a new computer.

---

## 🚀 1. How to Launch (Daily Operation)
To start the store system, follow these two simple steps:

1.  **Start the Brain**: Open a terminal in the `/backend` folder and type:
    ```bash
    node index.js
    ```
2.  **Open the Store**: Open your browser (Chrome/Edge) and go to:
    **[http://localhost:3000](http://localhost:3000)**

> [!TIP]
> This "Production Version" is optimized for speed and works on any device in your store's network.

---

## 🔑 2. Login Credentials
| Role | Username | Password |
| :--- | :--- | :--- |
| **Owner / Manager** | `admin` | `password123` |
| **Cashier / Staff** | `testuser` | `password123` |

*You can add or remove users at any time in the **Users** menu.*

---

## 🎨 3. Paint Mixing Guide
The system now supports both Decorative and Automotive paints.

*   **Decorative**: Mixing is done in **Milliliters (ml)**.
*   **Automotive (Car Paint)**: Mixing is done in **Grams (g)** for higher precision.
*   **Auto-Correction**: The system automatically detects if a pigment is a "Gram" based item and adjusts the inputs for you.
*   **Labels**: After mixing, click **"Generate Label"** to create a thermal sticker for the can.

---

## 🛡️ 4. Data Safety (Disaster Recovery)
Your data is stored in a file called `dev.db` inside the `backend/prisma` folder.

### **Backing Up (Do this Daily!)**
1. Go to **Settings** -> **Data Maintenance**.
2. Click **"Download .db File"**.
3. Save this file to a USB stick or a Cloud Drive (Google Drive/Dropbox).

### **Restoring (If things break)**
1. Go to **Settings** -> **Data Maintenance**.
2. Click **"Upload Backup"**.
3. Select your latest `.db` file. 
4. **Confirm overwrite.** The system will instantly reset to that exact moment in time.

---

## 📦 5. Moving to a New Computer
If you buy a new computer for the shop, follow these steps to ensure a 100% smooth transition.

### **Fresh Install Sequence:**
1.  **Copy**: Move the entire `Paint Center` folder to the new machine.
2.  **Install Node.js**: Download it from [nodejs.org](https://nodejs.org/).
3.  **Install Dependencies**: Open a terminal in the `/backend` folder and type:
    ```bash
    npm install
    ```
4.  **Initialize Database**: Type this command to "link" the database correctly to the new PC:
    ```bash
    npx prisma generate
    ```
5.  **Start the Store**: Type:
    ```bash
    node index.js
    ```
6.  **Open the App**: Go to [http://localhost:3000](http://localhost:3000) in your browser.

### **How to open the Terminal easily:**
*   **On Mac**: Right-click the `backend` folder and select **"New Terminal at Folder."**
*   **On Windows**: Open the `backend` folder, click the address bar at the top, type **`cmd`**, and press Enter.

---

## 🏷️ 6. Barcode Scanner Integration
Your system supports most USB and Bluetooth barcode scanners out of the box.
*   **Plug & Play**: Connect the scanner to your PC. It will act like a second keyboard.
*   **How to Scan**: Click the "Search" box on the POS or Inventory page, and trigger a scan. The system will automatically find and add the item.
*   **Troubleshooting**: If the item doesn't "Add" automatically after scanning, check your scanner manual to enable the **"Suffix Enter"** or **"CR/LF Suffix"** feature.

---

## 🖥️ 7. Desktop Shortcuts (Launch Icon)
To make the system feel like a real App:
1.  Open **Google Chrome** and go to `http://localhost:3000`.
2.  Click the **Three Dots** (Menu) -> **Save and Share** -> **Install page as app**.
3.  This creates a "Paint Center" icon in your applications that you can pin to your **Dock** or **Taskbar**.

---

**For technical support or feature requests, contact your developer.**
