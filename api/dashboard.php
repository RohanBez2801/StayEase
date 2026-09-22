<?php
// api/dashboard.php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Collect stats
    $stats = [];
    
    // Total Rooms
    $stats['totalRooms'] = $pdo->query("SELECT COUNT(*) FROM rooms")->fetchColumn();
    // Available Rooms
    $stats['availableRooms'] = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status='Available'")->fetchColumn();
    
    // Total Bookings (not cancelled)
    $stats['totalBookings'] = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status != 'Cancelled'")->fetchColumn();
    // Checked In Guests (sum of guests in Checked In status)
    $stats['checkedInGuests'] = $pdo->query("SELECT SUM(guests) FROM bookings WHERE status = 'Checked In'")->fetchColumn() ?: 0;
    
    echo json_encode(['success' => true, 'data' => $stats]);
}
