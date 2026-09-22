<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();
$page_title = 'Documentation';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="page-header">
    <div>
        <h1>System Documentation</h1>
        <p>PHP & MySQL Migration Overview.</p>
    </div>
</div>

<div class="card doc-content">
    <div class="card-body">
        <h2>1. Architecture Update</h2>
        <p>This application was migrated from a client-side localStorage prototype to a fully functional <strong>PHP and MySQL (PDO)</strong> architecture. The UI logic is preserved by leveraging PHP API endpoints.</p>

        <h2>2. Technical Features</h2>
        <ul>
            <li><strong>Authentication:</strong> Secure session-based authentication with <code>password_hash()</code>.</li>
            <li><strong>Security:</strong> All database queries use prepared statements. CSRF tokens protect all state-changing requests (forms and AJAX).</li>
            <li><strong>Database:</strong> Relational schema utilizing MySQL for <code>users</code>, <code>rooms</code>, <code>bookings</code>, and <code>payments</code>.</li>
            <li><strong>Server-Side Logic:</strong> Overlap validation, long-stay discounts (10%), tax calculation (15%), and capacity limits are all enforced server-side.</li>
        </ul>

        <h2>3. Database Schema Overview</h2>
        <p>The system stores logical relationships:</p>
        <ul>
            <li><code>bookings.user_id</code> references <code>users.id</code></li>
            <li><code>bookings.room_id</code> references <code>rooms.id</code></li>
            <li>Rooms belong to <code>room_types</code> (for pricing/capacity) and <code>hotels</code>.</li>
        </ul>

        <h2>4. Booking Flow</h2>
        <p>Guest searches for availability. PHP filters out rooms under maintenance and checks for any overlapping <code>Confirmed</code> or <code>Checked In</code> bookings using SQL: <code>check_in < req_out AND check_out > req_in</code>.</p>
        <p>When booking, a database transaction is opened. The server double-checks capacity, recalculates price, inserts the booking record, generates a reference (BK-XXXXX), and commits.</p>

        <h2>5. Admin Roles</h2>
        <p>An initial administrator account is seeded. Admins can view reports, manage guest accounts (without seeing their passwords), manage rooms, and update booking statuses.</p>
        
        <h2>6. Deprecated Prototype Features</h2>
        <div class="info-box" style="margin-top: 15px; background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460;">
            <strong>Important Notice:</strong> 
            <ul>
                <li><code>localStorage</code> is no longer the source of truth. All data is persistent.</li>
                <li>Physical deletion of bookings/guests with history is disabled to maintain referential integrity.</li>
                <li>Simulated Payment Gateway functionality remains a placeholder.</li>
            </ul>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
