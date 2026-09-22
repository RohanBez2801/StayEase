<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$page_title = 'My Bookings';
require_once __DIR__ . '/../includes/header.php';

$pdo = getDBConnection();
$stmt = $pdo->prepare("
    SELECT b.*, r.room_number, h.name as hotel_name, h.city 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE b.user_id = ?
    ORDER BY b.check_in DESC
");
$stmt->execute([$_SESSION['user_id']]);
$bookings = $stmt->fetchAll();
?>

<div class="page-header">
    <h1>My Bookings</h1>
    <p>View your past and upcoming stays.</p>
</div>

<?php if (empty($bookings)): ?>
    <div class="empty-state" style="text-align: center; padding: 50px; background: white; border-radius: 8px;">
        <span style="font-size: 48px;">🧳</span>
        <h3>No bookings yet</h3>
        <p>You haven't made any bookings yet.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 20px;">Book a stay</a>
    </div>
<?php else: ?>
    <div class="rooms-grid">
        <?php foreach ($bookings as $b): ?>
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <strong><?= escape($b['hotel_name']) ?>, <?= escape($b['city']) ?></strong>
                    <?php 
                        $statusClass = 'info';
                        if ($b['status'] === 'Confirmed') $statusClass = 'info';
                        if ($b['status'] === 'Checked In') $statusClass = 'success';
                        if ($b['status'] === 'Checked Out') $statusClass = 'warning';
                        if ($b['status'] === 'Cancelled') $statusClass = 'danger';
                    ?>
                    <span class="badge badge-<?= $statusClass ?>"><?= escape($b['status']) ?></span>
                </div>
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p class="text-muted" style="margin-bottom: 5px;">Reference: <strong><?= escape($b['booking_reference']) ?></strong></p>
                            <p style="margin-bottom: 5px;">Room <?= escape($b['room_number']) ?> &bull; <?= $b['guests'] ?> Guest(s)</p>
                            <p><?= formatDate($b['check_in']) ?> — <?= formatDate($b['check_out']) ?></p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 1.2em; font-weight: bold; color: var(--dark);"><?= formatCurrency($b['total']) ?></p>
                            <a href="/guest/confirmation.php?ref=<?= urlencode($b['booking_reference']) ?>" class="btn btn-sm btn-secondary" style="margin-top: 10px;">View Receipt</a>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
