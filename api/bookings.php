<?php
// api/bookings.php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/booking.php';

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
        SELECT b.booking_reference as id, CONCAT('G-', LPAD(b.user_id, 3, '0')) as guestId, 
               r.room_number as roomNumber, b.check_in as checkIn, b.check_out as checkOut, 
               b.guests as numGuests, b.status 
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.check_in DESC
    ");
    $bookings = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $bookings]);
} 
elseif ($method === 'POST') {
    requireCsrfToken();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action'])) {
        if ($data['action'] === 'status') {
            $ref = $data['id'] ?? '';
            $status = $data['status'] ?? '';
            
            $stmt = $pdo->prepare("UPDATE bookings SET status=? WHERE booking_reference=?");
            $stmt->execute([$status, $ref]);
            
            // If checked out or cancelled, the overlap logic naturally frees the room.
            echo json_encode(['success' => true]);
        }
        elseif ($data['action'] === 'save') {
            $guestIdStr = $data['guestId'] ?? '';
            $userId = (int)str_replace('G-', '', $guestIdStr);
            $roomNumber = $data['roomNumber'] ?? '';
            $checkIn = $data['checkIn'] ?? '';
            $checkOut = $data['checkOut'] ?? '';
            $guests = (int)($data['numGuests'] ?? 1);
            $editingId = $data['id'] ?? null;
            
            $stmt = $pdo->prepare("SELECT id FROM rooms WHERE room_number = ?");
            $stmt->execute([$roomNumber]);
            $room = $stmt->fetch();
            if (!$room) {
                echo json_encode(['success' => false, 'error' => 'Room not found.']);
                exit;
            }
            $roomId = $room['id'];
            
            if ($editingId) {
                // Update existing
                try {
                    $pdo->beginTransaction();
                    $stmt = $pdo->prepare("SELECT id FROM bookings WHERE booking_reference=?");
                    $stmt->execute([$editingId]);
                    $bk = $stmt->fetch();
                    $bkId = $bk['id'] ?? 0;
                    
                    if (!checkRoomAvailability($pdo, $roomId, $checkIn, $checkOut, $bkId)) {
                        throw new Exception("Room is already booked for these dates.");
                    }
                    
                    $stmt = $pdo->prepare("SELECT base_price FROM room_types rt JOIN rooms r ON r.room_type_id=rt.id WHERE r.id=?");
                    $stmt->execute([$roomId]);
                    $price = $stmt->fetchColumn();
                    $priceCalc = calculateBookingPrice($price, $checkIn, $checkOut);
                    
                    $stmt = $pdo->prepare("UPDATE bookings SET user_id=?, room_id=?, check_in=?, check_out=?, guests=?, subtotal=?, discount=?, tax=?, total=? WHERE booking_reference=?");
                    $stmt->execute([$userId, $roomId, $checkIn, $checkOut, $guests, $priceCalc['subtotal'], $priceCalc['discount'], $priceCalc['tax'], $priceCalc['total'], $editingId]);
                    
                    $pdo->commit();
                    echo json_encode(['success' => true]);
                } catch(Exception $e) {
                    $pdo->rollBack();
                    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                }
            } else {
                // Create new
                $result = createBooking($userId, $roomId, $checkIn, $checkOut, $guests, 'Admin Demo Payment');
                echo json_encode($result);
            }
        }
    }
}
