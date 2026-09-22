<?php
// includes/booking.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/functions.php';

function calculateBookingPrice($roomPrice, $checkIn, $checkOut) {
    $start = new DateTime($checkIn);
    $end = new DateTime($checkOut);
    $nights = $start->diff($end)->days;
    if ($nights <= 0) $nights = 1;

    $subtotal = $nights * $roomPrice;
    $discount = 0.00;
    
    if ($nights >= LONG_STAY_MIN_NIGHTS) {
        $discount = $subtotal * LONG_STAY_DISCOUNT_RATE;
    }
    
    $taxable = $subtotal - $discount;
    $tax = $taxable * TAX_RATE;
    $total = $taxable + $tax;
    
    return [
        'nights' => $nights,
        'subtotal' => $subtotal,
        'discount' => $discount,
        'tax' => $tax,
        'total' => $total
    ];
}

function checkRoomAvailability($pdo, $roomId, $checkIn, $checkOut, $excludeBookingId = null) {
    $sql = "SELECT id FROM bookings 
            WHERE room_id = :room_id 
            AND status NOT IN ('Cancelled', 'Checked Out') 
            AND (check_in < :check_out AND check_out > :check_in)";
            
    $params = [
        ':room_id' => $roomId,
        ':check_in' => $checkIn,
        ':check_out' => $checkOut
    ];
    
    if ($excludeBookingId !== null) {
        $sql .= " AND id != :exclude_id";
        $params[':exclude_id'] = $excludeBookingId;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // If it fetches a row, the room is NOT available
    return $stmt->fetch() === false;
}

function createBooking($userId, $roomId, $checkIn, $checkOut, $guests, $paymentMethod) {
    $pdo = getDBConnection();
    
    try {
        $pdo->beginTransaction();
        
        // 1. Validate room capacity and status
        $stmt = $pdo->prepare("SELECT r.id, r.status, r.room_number, rt.capacity, rt.base_price 
                               FROM rooms r
                               JOIN room_types rt ON r.room_type_id = rt.id
                               WHERE r.id = ? FOR UPDATE"); // FOR UPDATE locks the row
        $stmt->execute([$roomId]);
        $room = $stmt->fetch();
        
        if (!$room) {
            throw new Exception("Room not found.");
        }
        if ($room['status'] === 'Maintenance') {
            throw new Exception("Room is currently under maintenance.");
        }
        if ($guests > $room['capacity']) {
            throw new Exception("Number of guests exceeds room capacity.");
        }
        
        // 2. Check Dates
        if (strtotime($checkOut) <= strtotime($checkIn)) {
            throw new Exception("Check-out date must be after check-in date.");
        }
        
        // 3. Check Overlap
        if (!checkRoomAvailability($pdo, $roomId, $checkIn, $checkOut)) {
            throw new Exception("Room is already booked for these dates.");
        }
        
        // 4. Calculate Price
        $priceCalc = calculateBookingPrice($room['base_price'], $checkIn, $checkOut);
        
        // 5. Generate Reference
        $reference = generateBookingReference();
        
        // 6. Insert Booking
        $stmt = $pdo->prepare("INSERT INTO bookings 
            (booking_reference, user_id, room_id, check_in, check_out, guests, status, subtotal, discount, tax, total) 
            VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?, ?)");
        
        $stmt->execute([
            $reference, $userId, $roomId, $checkIn, $checkOut, $guests,
            $priceCalc['subtotal'], $priceCalc['discount'], $priceCalc['tax'], $priceCalc['total']
        ]);
        
        $bookingId = $pdo->lastInsertId();
        
        // 7. Insert Payment (Simulated)
        $stmt = $pdo->prepare("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (?, ?, ?, 'Completed')");
        $stmt->execute([$bookingId, $priceCalc['total'], $paymentMethod]);
        
        $pdo->commit();
        return ['success' => true, 'booking_reference' => $reference, 'booking_id' => $bookingId];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}
