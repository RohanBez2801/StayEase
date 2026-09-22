CREATE DATABASE IF NOT EXISTS stayease;
USE stayease;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('guest', 'admin') NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROOM TYPES TABLE
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    status ENUM('Available', 'Maintenance') NOT NULL DEFAULT 'Available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT,
    UNIQUE (hotel_id, room_number)
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled') NOT NULL DEFAULT 'Pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- SEED DATA
-- Seed Admin (Password: admin123)
INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
VALUES ('System', 'Admin', 'admin@stayease.local', '$2y$10$bBCb9lZL02MLsXO/9bE74.Ezsa9V7fT3VIkTSvhpPR.ZYJAixmYf.', '0000000000', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Seed Hotels
INSERT INTO hotels (id, name, city) VALUES 
(1, 'StayEase Cape Town', 'Cape Town'),
(2, 'StayEase Johannesburg', 'Johannesburg'),
(3, 'StayEase Durban', 'Durban')
ON DUPLICATE KEY UPDATE name=name;

-- Seed Room Types
INSERT INTO room_types (id, name, capacity, base_price, description) VALUES 
(1, 'Single', 1, 650.00, 'Cosy single room.'),
(2, 'Double', 2, 1200.00, 'Modern double room.'),
(3, 'Family', 4, 1800.00, 'Large family room.'),
(4, 'Suite', 2, 3500.00, 'Luxury suite.')
ON DUPLICATE KEY UPDATE name=name;

-- Seed Rooms
INSERT INTO rooms (hotel_id, room_type_id, room_number, status, description) VALUES
(1, 1, '101', 'Available', 'Cosy single room with a lovely garden view.'),
(1, 1, '102', 'Available', 'Quiet single room on the ground floor.'),
(2, 2, '201', 'Available', 'Spacious double room with a private balcony.'),
(2, 2, '202', 'Available', 'Modern double room with a city view.'),
(3, 3, '301', 'Available', 'Large family room with two queen-sized beds.'),
(1, 4, '401', 'Maintenance', 'Luxury suite with a private lounge and jacuzzi.')
ON DUPLICATE KEY UPDATE room_number=room_number;
