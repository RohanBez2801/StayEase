<?php
// api/rooms.php
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
    $stmt = $pdo->query("
        SELECT r.id, r.room_number as number, h.city as branch, rt.name as type, 
               rt.base_price as price, rt.capacity, r.status, r.description 
        FROM rooms r
        JOIN hotels h ON r.hotel_id = h.id
        JOIN room_types rt ON r.room_type_id = rt.id
        ORDER BY r.room_number ASC
    ");
    $rooms = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $rooms]);
} 
elseif ($method === 'POST') {
    requireCsrfToken();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action']) && $data['action'] === 'save') {
        $number = $data['number'] ?? '';
        $type = $data['type'] ?? '';
        $status = $data['status'] ?? 'Available';
        $description = $data['description'] ?? '';
        $editingId = $data['id'] ?? null;
        
        // Map type string to room_type_id for simplicity (assuming 1=Single, 2=Double, 3=Family, 4=Suite)
        $typeMap = ['Single' => 1, 'Double' => 2, 'Family' => 3, 'Suite' => 4];
        $typeId = $typeMap[$type] ?? 1;
        $hotelId = 1; // Default to Cape Town for simplicity in this port
        
        if ($editingId) {
            $stmt = $pdo->prepare("UPDATE rooms SET room_number=?, room_type_id=?, status=?, description=? WHERE room_number=?");
            $stmt->execute([$number, $typeId, $status, $description, $editingId]);
        } else {
            // Check if exists
            $stmt = $pdo->prepare("SELECT id FROM rooms WHERE room_number=?");
            $stmt->execute([$number]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Room number already exists.']);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO rooms (hotel_id, room_type_id, room_number, status, description) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$hotelId, $typeId, $number, $status, $description]);
        }
        echo json_encode(['success' => true]);
    }
}
elseif ($method === 'DELETE') {
    requireCsrfToken();
    $data = json_decode(file_get_contents('php://input'), true);
    $number = $data['number'] ?? '';
    
    // Check if room has active bookings
    $stmt = $pdo->prepare("SELECT b.id FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE r.room_number = ?");
    $stmt->execute([$number]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Cannot delete room because it has historical or active bookings. Change its status to Maintenance instead.']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM rooms WHERE room_number = ?");
    $stmt->execute([$number]);
    echo json_encode(['success' => true]);
}
