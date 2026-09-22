<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();
$page_title = 'Dashboard';
$extra_scripts = '<script src="/js/dashboard.js"></script>';
require_once __DIR__ . '/../includes/header.php';
?>
<!-- Welcome Banner -->
<div class="welcome-banner">
    <h1>Welcome to Book with Shipiki Admin</h1>
    <p>Manage your guest-house rooms, guests, and bookings all in one place.</p>
</div>

<!-- Summary Cards -->
<div class="summary-cards">
    <div class="summary-card">
        <div class="card-icon blue">🏠</div>
        <div class="card-info">
            <h3 id="totalRooms">0</h3>
            <p>Total Rooms</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon green">✅</div>
        <div class="card-info">
            <h3 id="availableRooms">0</h3>
            <p>Available Rooms</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon gold">📋</div>
        <div class="card-info">
            <h3 id="totalBookings">0</h3>
            <p>Total Bookings</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon teal">🧳</div>
        <div class="card-info">
            <h3 id="checkedInGuests">0</h3>
            <p>Checked-In Guests</p>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="quick-actions">
    <a href="/admin/bookings.php" class="btn btn-primary">📅 Manage Bookings</a>
    <a href="/admin/rooms.php" class="btn btn-secondary">🛏️ Manage Rooms</a>
    <a href="/admin/guests.php" class="btn btn-secondary">👥 Manage Guests</a>
</div>

<!-- Recent Bookings -->
<h2 class="section-title">Recent Bookings</h2>
<div class="table-responsive">
    <table class="data-table">
        <thead>
            <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="recentBookingsBody">
            <tr><td colspan="6" class="empty-table">Loading...</td></tr>
        </tbody>
    </table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
