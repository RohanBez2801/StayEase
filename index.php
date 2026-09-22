<?php
require_once __DIR__ . '/includes/auth.php';
$page_title = 'Welcome';
require_once __DIR__ . '/includes/header.php';

$pdo = getDBConnection();
$hotels = $pdo->query("SELECT id, city FROM hotels ORDER BY city")->fetchAll();

$today = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));
?>
<div class="welcome-banner" style="background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);">
    <h1>Find your perfect stay.</h1>
    <p>Book directly with Shipiki Hotels for the best rates and service.</p>
</div>

<div class="card" style="margin-top: -30px; margin-left: 20px; margin-right: 20px; position: relative; z-index: 10;">
    <div class="card-body">
        <form method="GET" action="/guest/search.php" class="form-row" style="align-items: flex-end;">
            <div class="form-group" style="flex: 2;">
                <label for="location">Location</label>
                <select id="location" name="location" required>
                    <option value="">Where are you going?</option>
                    <?php foreach ($hotels as $h): ?>
                        <option value="<?= $h['id'] ?>"><?= escape($h['city']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group" style="flex: 1.5;">
                <label for="check_in">Check-in</label>
                <input type="date" id="check_in" name="check_in" required min="<?= $today ?>" value="<?= $today ?>">
            </div>
            <div class="form-group" style="flex: 1.5;">
                <label for="check_out">Check-out</label>
                <input type="date" id="check_out" name="check_out" required min="<?= $tomorrow ?>" value="<?= $tomorrow ?>">
            </div>
            <div class="form-group" style="flex: 1;">
                <label for="guests">Guests</label>
                <input type="number" id="guests" name="guests" min="1" max="10" value="1" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;">Search</button>
            </div>
        </form>
    </div>
</div>

<div style="padding: 40px 20px;">
    <h2 class="section-title text-center" style="margin-bottom: 30px;">Why stay with us?</h2>
    <div class="summary-cards">
        <div class="summary-card" style="text-align: center;">
            <div class="card-icon blue" style="margin: 0 auto 15px auto;">🌟</div>
            <h3>Premium Service</h3>
            <p>Experience world-class hospitality at all our branches.</p>
        </div>
        <div class="summary-card" style="text-align: center;">
            <div class="card-icon green" style="margin: 0 auto 15px auto;">💰</div>
            <h3>Best Rates</h3>
            <p>10% discount automatically applied for stays longer than 3 nights.</p>
        </div>
        <div class="summary-card" style="text-align: center;">
            <div class="card-icon gold" style="margin: 0 auto 15px auto;">📍</div>
            <h3>Great Locations</h3>
            <p>Find us in Cape Town, Johannesburg, and Durban.</p>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
