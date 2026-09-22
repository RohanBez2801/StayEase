<?php 
require_once __DIR__ . '/auth.php'; 
$csrf_token = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($page_title) ? escape($page_title) . ' - ' : '' ?>Book with Shipiki</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css">
    <meta name="csrf-token" content="<?= escape($csrf_token) ?>">
</head>
<body>
    <!-- Mobile Header -->
    <header class="mobile-header">
        <button class="menu-toggle" onclick="toggleMobileMenu()">☰</button>
        <a href="/" class="logo" style="text-decoration:none;">🏨 Book with Shipiki</a>
    </header>

    <!-- Sidebar Navigation -->
    <nav class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo">🏨 Shipiki</div>
            <p class="tagline">Hotel Reservation System</p>
        </div>
        <ul class="nav-links">
            <?php if (isAdmin()): ?>
                <li><a href="/admin/index.php" class="nav-link"><span class="nav-icon">📊</span> Dashboard</a></li>
                <li><a href="/admin/rooms.php" class="nav-link"><span class="nav-icon">🛏️</span> Rooms</a></li>
                <li><a href="/admin/guests.php" class="nav-link"><span class="nav-icon">👥</span> Guests</a></li>
                <li><a href="/admin/bookings.php" class="nav-link"><span class="nav-icon">📅</span> Bookings</a></li>
                <li><a href="/admin/reports.php" class="nav-link"><span class="nav-icon">📈</span> Reports</a></li>
                <li><a href="/admin/documentation.php" class="nav-link"><span class="nav-icon">📖</span> Documentation</a></li>
                <li><a href="/guest/logout.php" class="nav-link"><span class="nav-icon">🚪</span> Logout</a></li>
            <?php else: ?>
                <li><a href="/" class="nav-link"><span class="nav-icon">🏠</span> Home</a></li>
                <?php if (isLoggedIn()): ?>
                    <li><a href="/guest/my-bookings.php" class="nav-link"><span class="nav-icon">🧳</span> My Bookings</a></li>
                    <li><a href="/guest/logout.php" class="nav-link"><span class="nav-icon">🚪</span> Logout</a></li>
                <?php else: ?>
                    <li><a href="/guest/login.php" class="nav-link"><span class="nav-icon">🔑</span> Login</a></li>
                    <li><a href="/guest/register.php" class="nav-link"><span class="nav-icon">✍️</span> Register</a></li>
                <?php endif; ?>
            <?php endif; ?>
        </ul>
        <div class="sidebar-footer">
            <p style="color:rgba(255,255,255,0.5); font-size:12px; text-align:center;">&copy; <?= date('Y') ?> Shipiki Hotels</p>
        </div>
    </nav>

    <!-- Overlay for mobile menu -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleMobileMenu()"></div>

    <!-- Main Content -->
    <main class="main-content">
        <?php if ($msg = getFlashMessage()): ?>
            <div class="alert alert-<?= $msg['type'] ?>" style="margin-bottom:20px; padding:15px; border-radius:4px; 
                background-color: <?= $msg['type'] === 'error' ? '#fed7d7' : ($msg['type'] === 'success' ? '#c6f6d5' : '#bee3f8') ?>;
                color: <?= $msg['type'] === 'error' ? '#9b2c2c' : ($msg['type'] === 'success' ? '#276749' : '#2b6cb0') ?>;">
                <?= escape($msg['text']) ?>
            </div>
        <?php endif; ?>
