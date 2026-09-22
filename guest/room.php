<?php
require_once __DIR__ . '/../includes/auth.php';
$page_title = 'Room Details';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/booking.php';

$roomId = (int)($_GET['id'] ?? 0);
$checkIn = $_GET['check_in'] ?? '';
$checkOut = $_GET['check_out'] ?? '';
$guests = (int)($_GET['guests'] ?? 1);

if (!$roomId || !$checkIn || !$checkOut) {
    redirect('/');
}

$pdo = getDBConnection();
$stmt = $pdo->prepare("
    SELECT r.id, r.room_number, rt.name as type, rt.capacity, rt.base_price, r.description, h.name as hotel_name, h.city
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE r.id = ?
");
$stmt->execute([$roomId]);
$room = $stmt->fetch();

if (!$room) {
    echo "<div class='alert alert-danger'>Room not found.</div>";
    require_once __DIR__ . '/../includes/footer.php';
    exit;
}

// Calculate preview price
$calc = calculateBookingPrice($room['base_price'], $checkIn, $checkOut);
$isAvailable = checkRoomAvailability($pdo, $roomId, $checkIn, $checkOut);
?>

<div class="page-header">
    <a href="/guest/search.php?location=<?= urlencode($room['city']) ?>&check_in=<?= urlencode($checkIn) ?>&check_out=<?= urlencode($checkOut) ?>&guests=<?= $guests ?>" class="btn btn-secondary">← Back to Results</a>
</div>

<div class="form-row" style="align-items: flex-start;">
    <div class="card" style="flex: 2;">
        <div class="card-header">
            <h2>Room <?= escape($room['room_number']) ?> - <?= escape($room['type']) ?></h2>
            <p class="text-muted"><?= escape($room['hotel_name']) ?>, <?= escape($room['city']) ?></p>
        </div>
        <div class="card-body">
            <p><?= nl2br(escape($room['description'])) ?></p>
            <hr>
            <h4>Amenities & Details</h4>
            <ul style="margin-top: 10px; margin-left: 20px;">
                <li>Capacity: <?= $room['capacity'] ?> Guest(s)</li>
                <li>Free Wi-Fi</li>
                <li>Air Conditioning</li>
                <li>En-suite Bathroom</li>
            </ul>
        </div>
    </div>
    
    <div class="card" style="flex: 1;">
        <div class="card-header">
            <h3>Stay Details</h3>
        </div>
        <div class="card-body">
            <div class="receipt-row"><span>Check-In:</span><strong><?= formatDate($checkIn) ?></strong></div>
            <div class="receipt-row"><span>Check-Out:</span><strong><?= formatDate($checkOut) ?></strong></div>
            <div class="receipt-row"><span>Guests:</span><strong><?= $guests ?></strong></div>
            <hr>
            <div class="receipt-row"><span>Nights:</span><span><?= $calc['nights'] ?></span></div>
            <div class="receipt-row"><span>Price/Night:</span><span><?= formatCurrency($room['base_price']) ?></span></div>
            <div class="receipt-row"><span>Subtotal:</span><span><?= formatCurrency($calc['subtotal']) ?></span></div>
            
            <?php if ($calc['discount'] > 0): ?>
                <div class="receipt-row" style="color: var(--success);"><span>Discount (>3 nights):</span><span>-<?= formatCurrency($calc['discount']) ?></span></div>
            <?php endif; ?>
            
            <div class="receipt-row"><span>Tax (15%):</span><span><?= formatCurrency($calc['tax']) ?></span></div>
            
            <div class="receipt-row" style="font-size: 1.2em; font-weight: bold; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span>Total:</span><span><?= formatCurrency($calc['total']) ?></span>
            </div>
            
            <div style="margin-top: 20px;">
                <?php if ($guests > $room['capacity']): ?>
                    <div class="alert alert-danger">Too many guests for this room.</div>
                <?php elseif (!$isAvailable): ?>
                    <div class="alert alert-danger">Room is no longer available for these dates.</div>
                <?php else: ?>
                    <form action="/guest/checkout.php" method="POST">
                        <input type="hidden" name="csrf_token" value="<?= escape($csrf_token) ?>">
                        <input type="hidden" name="room_id" value="<?= $roomId ?>">
                        <input type="hidden" name="check_in" value="<?= escape($checkIn) ?>">
                        <input type="hidden" name="check_out" value="<?= escape($checkOut) ?>">
                        <input type="hidden" name="guests" value="<?= $guests ?>">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Continue to Checkout</button>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
