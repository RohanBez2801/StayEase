# StayEase Hotel Booking System (PHP & MySQL Edition)

A fully functional Hotel Booking System originally built as a client-side prototype, now upgraded to a robust **PHP + MySQL** architecture while maintaining its beginner-friendly code structure and responsive UI.

This version moves all critical business rules (double-booking prevention, pricing, capacity checks) to the server-side, securing the system and providing a genuine relational database backend.

## Architecture

This project uses a hybrid approach:
- **Guest Facing:** Traditional PHP server-rendered pages for search, checkout, and authentication.
- **Admin Dashboard:** Preserves the dynamic, modal-heavy JavaScript application feel by communicating with PHP API endpoints via `fetch()`.

## Features

### Guest Features
- **Account Management:** User registration and login.
- **Search Engine:** Check availability by date, location, and guest count. Overlap logic enforced server-side.
- **Booking Flow:** Review room details, confirm stays, and simulate payment.
- **My Bookings:** View active and past stays, and print receipts.

### Admin Features (Dashboard)
- **Dashboard:** At-a-glance hotel statistics (occupancy, income, recent bookings).
- **Room Management:** Add, edit, and update room maintenance status.
- **Guest Management:** Maintain a guest database.
- **Booking Management:** Create bookings for guests, cancel bookings, and update check-in/out statuses.
- **Reporting & Export:** CSS-only charts for visualising occupancy, and a button to export all booking data directly to a CSV file.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES5/ES6) with async/await.
- **Backend:** PHP (Session management, PDO for database access).
- **Database:** MySQL / MariaDB (Relational schema, constraints, prepared statements).
- **Security:** CSRF tokens for all state-changing operations, password hashing.

## How to Run Locally

1. **Prerequisites:** Ensure you have a PHP environment installed (e.g. XAMPP, WAMP, or MAMP) and a running MySQL server.
2. **Database Setup:** 
   - Open your MySQL management tool (e.g., phpMyAdmin).
   - Create a database named `stayease` (or allow the script to create it).
   - Import the `database/schema.sql` file. This will create all tables and insert the required seed data.
3. **Configuration:**
   - Open `includes/config.php` and verify the `DB_USER` and `DB_PASS` match your local MySQL credentials.
4. **Run the Application:**
   - Place the project folder in your web server's document root (e.g., `htdocs` for XAMPP).
   - Navigate to `http://localhost/StayEase` in your browser.
5. **Login Credentials:**
   - The database seed includes a default administrator account:
   - **Email:** `admin@stayease.local`
   - **Password:** `admin123`

## Project Structure

```
stayease/
├── index.php                 # Guest Landing Page & Search
├── api/                      # Admin JSON endpoints
│   ├── bookings.php
│   ├── dashboard.php
│   ├── guests.php
│   └── rooms.php
├── admin/                    # Admin Dashboard interfaces
│   ├── bookings.php
│   ├── documentation.php
│   ├── guests.php
│   ├── index.php
│   ├── reports.php
│   └── rooms.php
├── database/
│   └── schema.sql            # MySQL table structure & seed data
├── guest/                    # Guest interfaces & Auth
│   ├── checkout.php
│   ├── confirmation.php
│   ├── login.php
│   ├── logout.php
│   ├── my-bookings.php
│   ├── register.php
│   └── search.php
├── includes/                 # Core server logic
│   ├── auth.php
│   ├── booking.php
│   ├── config.php
│   ├── database.php
│   ├── footer.php
│   ├── functions.php
│   └── header.php
├── css/
│   └── style.css             # Main stylesheet
├── js/
│   ├── bookings.js
│   ├── dashboard.js
│   ├── data.js               # API Fetch wrapper
│   ├── guests.js
│   ├── reports.js
│   ├── rooms.js
│   └── utils.js              
└── README.md                 
```
