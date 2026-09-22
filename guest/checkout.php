<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('/');
}

requireCsrfToken();
require_once __DIR__ . '/../includes/booking.php';

$roomId = (int)($_POST['room_id'] ?? 0);
$checkIn = $_POST['check_in'] ?? '';
$checkOut = $_POST['check_out'] ?? '';
$guests = (int)($_POST['guests'] ?? 1);
$action = $_POST['action'] ?? 'preview';

$pdo = getDBConnection();
$stmt = $pdo->prepare("
    SELECT r.id, r.room_number, rt.name as type, rt.capacity, rt.base_price, h.name as hotel_name, h.city
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE r.id = ?
");
$stmt->execute([$roomId]);
$room = $stmt->fetch();

if (!$room) {
    setFlashMessage("Room not found.", "error");
    redirect('/');
}

$user = currentUser();
$calc = calculateBookingPrice($room['base_price'], $checkIn, $checkOut);

if ($action === 'confirm') {
    $paymentMethod = $_POST['payment_method'] ?? 'Credit Card';
    
    // Server-side booking creation handles transaction, overlap, and capacity checks
    $result = createBooking($user['id'], $roomId, $checkIn, $checkOut, $guests, $paymentMethod);
    
    if ($result['success']) {
        setFlashMessage("Booking confirmed successfully!", "success");
        redirect('/guest/confirmation.php?ref=' . urlencode($result['booking_reference']));
    } else {
        $error = $result['error'];
    }
}

$page_title = 'Checkout';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
    <h1>Confirm Booking</h1>
    <p>Review your details and complete your reservation.</p>
</div>

<?php if (!empty($error)): ?>
    <div class="alert alert-danger" style="margin-bottom:20px;"><?= escape($error) ?></div>
<?php endif; ?>

<form action="/guest/checkout.php" method="POST" class="form-row" style="align-items: flex-start;">
    <input type="hidden" name="csrf_token" value="<?= escape($csrf_token) ?>">
    <input type="hidden" name="room_id" value="<?= $roomId ?>">
    <input type="hidden" name="check_in" value="<?= escape($checkIn) ?>">
    <input type="hidden" name="check_out" value="<?= escape($checkOut) ?>">
    <input type="hidden" name="guests" value="<?= $guests ?>">
    <input type="hidden" name="action" value="confirm">

    <div class="card" style="flex: 2;">
        <div class="card-header">
            <h3>Guest Details</h3>
        </div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" value="<?= escape($user['first_name']) ?>" readonly>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" value="<?= escape($user['last_name']) ?>" readonly>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" value="<?= escape($user['email']) ?>" readonly>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" value="<?= escape($user['phone'] ?? '') ?>" readonly>
                </div>
            </div>
            
            <hr style="margin: 30px 0;">
            
            <h3>Payment Method (Simulated)</h3>
            <div class="form-group" style="margin-top: 15px;">
                <label>Select Payment Method</label>
                <select name="payment_method" required>
                    <option value="Credit Card">Credit/Debit Card</option>
                    <option value="EFT">Instant EFT</option>
                    <option value="Pay upon arrival">Pay upon arrival</option>
                </select>
                <small class="text-muted">Note: No real payments are processed in this prototype.</small>
            </div>
        </div>
    </div>
    
    <div class="card" style="flex: 1.2;">
        <div class="card-header">
            <h3>Booking Summary</h3>
        </div>
        <div class="card-body">
            <h4><?= escape($room['hotel_name']) ?></h4>
            <p class="text-muted">Room <?= escape($room['room_number']) ?> - <?= escape($room['type']) ?></p>
            <hr>
            <div class="receipt-row"><span>Check-In:</span><strong><?= formatDate($checkIn) ?></strong></div>
            <div class="receipt-row"><span>Check-Out:</span><strong><?= formatDate($checkOut) ?></strong></div>
            <div class="receipt-row"><span>Guests:</span><strong><?= $guests ?></strong></div>
            <div class="receipt-row"><span>Nights:</span><strong><?= $calc['nights'] ?></strong></div>
            <hr>
            <div class="receipt-row"><span>Subtotal:</span><span><?= formatCurrency($calc['subtotal']) ?></span></div>
            <?php if ($calc['discount'] > 0): ?>
                <div class="receipt-row" style="color: var(--success);"><span>Discount (>3 nights):</span><span>-<?= formatCurrency($calc['discount']) ?></span></div>
            <?php endif; ?>
            <div class="receipt-row"><span>Tax (15%):</span><span><?= formatCurrency($calc['tax']) ?></span></div>
            
            <div class="receipt-row" style="font-size: 1.2em; font-weight: bold; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span>Total:</span><span><?= formatCurrency($calc['total']) ?></span>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Confirm & Pay</button>
        </div>
    </div>
</form>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
