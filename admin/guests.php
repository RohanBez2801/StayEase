<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();
$page_title = 'Guests';
$extra_scripts = '<script src="/js/guests.js"></script>';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="page-header">
    <div>
        <h1>Manage Guests</h1>
        <p>View, add, and edit guest details.</p>
    </div>
    <button class="btn btn-primary" onclick="openAddGuestModal()">+ Add New Guest</button>
</div>

<div class="filter-bar">
    <input type="search" id="guestSearch" class="search-input" placeholder="🔍 Search guests by name, ID, email or phone...">
</div>

<div class="table-responsive">
    <table class="data-table">
        <thead>
            <tr>
                <th>Guest ID</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>ID / Passport</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="guestsTableBody">
            <!-- Guest rows dynamically generated here -->
        </tbody>
    </table>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
