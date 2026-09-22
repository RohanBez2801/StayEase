<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();
$page_title = 'Rooms';
$extra_scripts = '<script src="/js/rooms.js"></script>';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="page-header">
    <div>
        <h1>Manage Rooms</h1>
        <p>Add, edit, or remove hotel rooms.</p>
    </div>
    <button class="btn btn-primary" onclick="openAddRoomModal()">+ Add New Room</button>
</div>

<div class="filter-bar">
    <input type="search" id="roomSearch" class="search-input" placeholder="🔍 Search rooms by number or type...">
    <div class="filter-group">
        <select id="filterType">
            <option value="">All Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Family">Family</option>
            <option value="Suite">Suite</option>
        </select>
        <select id="filterStatus">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
        </select>
    </div>
</div>

<div class="rooms-grid" id="roomsGrid">
    <!-- Room cards dynamically generated here -->
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
