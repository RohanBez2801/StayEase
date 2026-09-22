<?php
require_once __DIR__ . '/../includes/auth.php';
$page_title = 'Search Results';
require_once __DIR__ . '/../includes/header.php';

$hotelId = (int)($_GET['location'] ?? 0);
$checkIn = $_GET['check_in'] ?? '';
$checkOut = $_GET['check_out'] ?? '';
$guests = (int)($_GET['guests'] ?? 1);

$errors = [];
if (!$hotelId || !$checkIn || !$checkOut || $guests < 1) {
    $errors[] = "Please provide all search criteria.";
} elseif (strtotime($checkOut) <= strtotime($checkIn)) {
    $errors[] = "Check-out date must be after check-in date.";
}

$rooms = [];
if (empty($errors)) {
    $pdo = getDBConnection();
    
    // We want rooms in this hotel, with enough capacity, not in maintenance, 
    // AND NOT overlapping any Confirmed/Checked In bookings for these dates.
    $sql = "
        SELECT r.id, r.room_number, rt.name as type, rt.capacity, rt.base_price, r.description, h.city
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        JOIN hotels h ON r.hotel_id = h.id
        WHERE r.hotel_id = :hotel_id
        AND r.status != 'Maintenance'
        AND rt.capacity >= :guests
        AND NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = r.id
            AND b.status NOT IN ('Cancelled', 'Checked Out')
            AND (b.check_in < :check_out AND b.check_out > :check_in)
        )
        ORDER BY rt.base_price ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':hotel_id' => $hotelId,
        ':guests' => $guests,
        ':check_in' => $checkIn,
        ':check_out' => $checkOut
    ]);
    $rooms = $stmt->fetchAll();
}
?>

<div class="page-header">
    <div>
        <h1>Search Results</h1>
        <p>
            <?= empty($errors) ? escape(date('j M', strtotime($checkIn)) . ' — ' . date('j M Y', strtotime($checkOut)) . ' • ' . $guests . ' Guest(s)') : 'Invalid search' ?>
        </p>
    </div>
    <a href="/" class="btn btn-secondary">Modify Search</a>
</div>

<?php if (!empty($errors)): ?>
    <div class="alert alert-danger" style="color: #9b2c2c; background-color: #fed7d7; padding: 15px; border-radius: 4px;">
        <?php foreach ($errors as $e) echo escape($e) . "<br>"; ?>
    </div>
<?php elseif (empty($rooms)): ?>
    <div class="empty-state" style="text-align: center; padding: 50px; background: white; border-radius: 8px;">
        <span style="font-size: 48px;">😔</span>
        <h3>No rooms available</h3>
        <p>We couldn't find any rooms matching your criteria. Try changing your dates or location.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 20px;">Search Again</a>
    </div>
<?php else: ?>
    <div class="rooms-grid">
        <?php foreach ($rooms as $room): ?>
            <div class="room-card card">
                <div class="room-card-header">
                    <span class="room-number">Room <?= escape($room['room_number']) ?></span>
                </div>
                <div class="room-card-body">
                    <div class="room-type">
                        <?php
                            $icon = '🛏️';
                            if ($room['type'] === 'Family') $icon = '👨‍👩‍👧‍👦';
                            if ($room['type'] === 'Suite') $icon = '👑';
                        ?>
                        <?= $icon ?> <?= escape($room['type']) ?> (<?= escape($room['city']) ?>)
                    </div>
                    <p class="room-description"><?= escape($room['description']) ?></p>
                    <div class="room-details">
                        <span class="room-price"><?= formatCurrency($room['base_price']) ?> <small>/ night</small></span>
                        <span class="room-capacity">👥 <?= $room['capacity'] ?> Guest(s)</span>
                    </div>
                </div>
                <div class="room-card-actions">
                    <a href="/guest/room.php?id=<?= $room['id'] ?>&check_in=<?= urlencode($checkIn) ?>&check_out=<?= urlencode($checkOut) ?>&guests=<?= $guests ?>" class="btn btn-primary" style="width: 100%; text-align: center;">View & Book</a>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
