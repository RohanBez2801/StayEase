<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();
$page_title = 'Reports & Analytics';
$extra_scripts = '<script src="/js/reports.js"></script>';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="page-header">
    <div>
        <h1>Reports & Analytics</h1>
        <p>View hotel performance and booking statistics.</p>
    </div>
    <button class="btn btn-secondary" onclick="exportCSV()">📥 Export as CSV</button>
</div>

<div class="summary-cards">
    <div class="summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-info">
            <h3 id="reportTotalIncome">R 0</h3>
            <p>Total Estimated Income</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon blue">📅</div>
        <div class="card-info">
            <h3 id="reportTotalBookings">0</h3>
            <p>Active Bookings</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon teal">📈</div>
        <div class="card-info">
            <h3 id="reportOccupancyRate">0%</h3>
            <p>Current Occupancy Rate</p>
        </div>
    </div>
    <div class="summary-card">
        <div class="card-icon green">👥</div>
        <div class="card-info">
            <h3 id="reportTotalGuests">0</h3>
            <p>Total Registered Guests</p>
        </div>
    </div>
</div>

<div class="form-row" style="margin-bottom:32px;">
    <div class="card">
        <div class="card-header">
            <h3>Room Status Distribution</h3>
        </div>
        <div class="card-body" id="roomStatusChart">
            <!-- CSS Chart generated here -->
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <h3>Booking Status Breakdown</h3>
        </div>
        <div class="card-body" id="bookingStatusChart">
            <!-- CSS Chart generated here -->
        </div>
    </div>
</div>

<div class="card" style="margin-bottom:32px;">
    <div class="card-header">
        <h3>Booking Timeline (Upcoming Check-ins)</h3>
    </div>
    <div class="card-body" id="bookingTimeline">
        <!-- Timeline generated here -->
    </div>
</div>

<h2 class="section-title">All Bookings Report</h2>
<div class="table-responsive">
    <table class="data-table">
        <thead>
            <tr>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Nights</th>
                <th>Total Cost</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="reportTableBody">
            <!-- Report rows dynamically generated here -->
        </tbody>
    </table>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
