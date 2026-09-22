# StayEase Hotel Booking System

A fully functional, beginner-friendly Hotel Booking System built as a multi-page responsive web app using only **HTML, CSS, JavaScript, and localStorage**. 

Designed specifically as a Grade 11 Computer Science coursework project, it focuses on clean code structure, core CRUD operations, date math, validation logic, and state management without the complexity of a backend server.

## Features

- **Dashboard:** At-a-glance hotel statistics (occupancy, income, recent bookings).
- **Room Management:** Add, edit, and delete rooms. Tracks room type, price, capacity, and current status.
- **Guest Management:** Maintain a guest database with validation for emails and phone numbers.
- **Booking Engine:** 
  - Dynamic cost calculation based on number of nights.
  - Strict date validation (Check-out must be after check-in).
  - Overlap detection (prevents double-booking a room on the same dates).
  - Capacity checking (prevents booking 3 people into a 1-person room).
- **Receipt Generation:** Automatically builds a printable receipt for confirmed bookings.
- **Reporting & Export:** CSS-only charts for visualising occupancy, and a button to export all booking data directly to a CSV file.
- **Data Persistence:** Uses the browser's localStorage API to save all data.
- **Responsive Design:** A custom, dark-navy and teal hotel-themed CSS stylesheet that works on desktop, tablet, and mobile.

## Tech Stack

- **HTML5:** Semantic page structure (6 individual pages).
- **CSS3:** Flexbox, CSS Grid, Custom Properties (Variables), Media Queries, Keyframe Animations. (No Tailwind or Bootstrap).
- **Vanilla JavaScript:** DOM manipulation, array filtering/mapping, date mathematics, and local storage interfacing.

## How to Run

Because this project relies entirely on client-side technologies, it is incredibly easy to run:

1. Clone or download this repository to your computer.
2. Open the folder StayEase.
3. Double-click on index.html to open it in your default web browser (Chrome, Firefox, Edge, etc.).
4. The system will automatically detect that it's empty and inject sample data (rooms, guests, bookings) so you can test it immediately.

## Project Structure

`
stayease/
├── index.html              # Dashboard / Home
├── rooms.html              # Room Management
├── guests.html             # Guest Management
├── bookings.html           # Booking Management
├── reports.html            # Reports & Analytics
├── documentation.html      # Coursework Documentation / Test Plan
├── css/
│   └── style.css           # Single comprehensive stylesheet
├── js/
│   ├── data.js             # LocalStorage helpers & sample data
│   ├── utils.js            # Shared logic (dates, currency, modals, toasts)
│   ├── dashboard.js        # Dashboard calculations
│   ├── rooms.js            # Room CRUD & filtering
│   ├── guests.js           # Guest CRUD & validation
│   ├── bookings.js         # Booking logic & overlap detection
│   └── reports.js          # Charts & CSV export
└── README.md               # This file
`

## Resetting Data
If you want to clear your changes and return the app to its original demo state, simply click the **"Reset Demo Data"** button located at the bottom of the sidebar navigation.
