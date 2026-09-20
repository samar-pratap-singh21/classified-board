-- Run this file in MySQL to create the database and tables
-- Usage: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS classifieds_board;
USE classifieds_board;

-- Users table (for login/register)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category ENUM('For Sale', 'Services', 'Rentals', 'Jobs', 'Lost & Found') NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    contact VARCHAR(100) NOT NULL,
    status ENUM('active', 'closed', 'expired') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);