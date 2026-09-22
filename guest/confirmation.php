<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$ref = $_GET['ref'] ?? '';
if (!$ref) {
    redirect('/');
}

$pdo = getDBConnection();
$stmt = $pdo->prepare("
    SELECT b.*, r.room_number, rt.name as type, h.name as hotel_name, h.city 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE b.booking_reference = ? AND b.user_id = ?
");
// Ensure user can only view their own receipt
$stmt->execute([$ref, $_SESSION['user_id']]);
$booking = $stmt->fetch();

if (!$booking) {
    setFlashMessage("Booking not found or unauthorized.", "error");
    redirect('/');
}

$page_title = 'Booking Confirmation';
require_once __DIR__ . '/../includes/header.php';
$user = currentUser();
?>

<div class="receipt" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div class="receipt-header" style="text-align: center; border-bottom: 2px solid var(--primary); padding-bottom: 20px; margin-bottom: 30px;">
        <h2 style="color: var(--dark); margin: 0; font-size: 24px;">🏨 Shipiki Hotels</h2>
        <p style="color: var(--gray); margin: 5px 0 0;">Booking Confirmation Receipt</p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h3>Booking Confirmed!</h3>
        <p>Your booking reference is <strong><?= escape($booking['booking_reference']) ?></strong></p>
    </div>

    <div class="receipt-section" style="margin-bottom: 20px;">
        <h4 style="color: var(--primary); border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Guest Details</h4>
        <div class="receipt-row"><span>Name:</span><span><?= escape($user['first_name'] . ' ' . $user['last_name']) ?></span></div>
        <div class="receipt-row"><span>Email:</span><span><?= escape($user['email']) ?></span></div>
    </div>
    
    <div class="receipt-section" style="margin-bottom: 20px;">
        <h4 style="color: var(--primary); border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Stay Details</h4>
        <div class="receipt-row"><span>Hotel:</span><span><?= escape($booking['hotel_name']) ?>, <?= escape($booking['city']) ?></span></div>
        <div class="receipt-row"><span>Room:</span><span>Room <?= escape($booking['room_number']) ?> (<?= escape($booking['type']) ?>)</span></div>
        <div class="receipt-row"><span>Guests:</span><span><?= $booking['guests'] ?></span></div>
        <div class="receipt-row"><span>Check-In:</span><span><?= formatDate($booking['check_in']) ?></span></div>
        <div class="receipt-row"><span>Check-Out:</span><span><?= formatDate($booking['check_out']) ?></span></div>
    </div>
    
    <div class="receipt-section receipt-total" style="border-top: 2px solid var(--dark); padding-top: 15px; margin-top: 20px;">
        <div class="receipt-row"><span>Subtotal:</span><span><?= formatCurrency($booking['subtotal']) ?></span></div>
        <?php if ($booking['discount'] > 0): ?>
            <div class="receipt-row" style="color: var(--success);"><span>Discount (>3 nights):</span><span>-<?= formatCurrency($booking['discount']) ?></span></div>
        <?php endif; ?>
        <div class="receipt-row"><span>Tax (15%):</span><span><?= formatCurrency($booking['tax']) ?></span></div>
        <div class="receipt-row total-row" style="font-size: 18px; color: var(--dark); font-weight: bold; margin-top: 10px;">
            <span>Total Paid:</span><strong><?= formatCurrency($booking['total']) ?></strong>
        </div>
    </div>
    
    <div class="form-actions" style="margin-top: 30px; justify-content: center;">
        <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Receipt</button>
        <a href="/guest/my-bookings.php" class="btn btn-primary">View My Bookings</a>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
