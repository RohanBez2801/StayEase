<?php
require_once __DIR__ . '/../includes/auth.php';

if (isLoggedIn()) {
    redirect('/');
}

$page_title = 'Register';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['password_confirm'] ?? '';
    
    $errors = [];
    
    if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
        $errors[] = "Please fill in all required fields.";
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Please enter a valid email address.";
    }
    if ($password !== $passwordConfirm) {
        $errors[] = "Passwords do not match.";
    }
    
    if (empty($errors)) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $errors[] = "An account with this email already exists.";
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, 'guest')");
            if ($stmt->execute([$firstName, $lastName, $email, $hash, $phone])) {
                setFlashMessage("Registration successful. Please log in.", "success");
                redirect('/guest/login.php');
            } else {
                $errors[] = "A database error occurred. Please try again.";
            }
        }
    }
}
require_once __DIR__ . '/../includes/header.php';
?>

<div class="card" style="max-width: 500px; margin: 0 auto; margin-top: 40px;">
    <div class="card-header">
        <h2>Register</h2>
    </div>
    <div class="card-body">
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger" style="margin-bottom: 20px; color: #9b2c2c; background-color: #fed7d7; padding: 12px; border-radius: 4px;">
                <?php foreach ($errors as $err) echo escape($err) . "<br>"; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <input type="hidden" name="csrf_token" value="<?= escape($csrf_token) ?>">
            
            <div class="form-row">
                <div class="form-group">
                    <label for="first_name">First Name *</label>
                    <input type="text" id="first_name" name="first_name" value="<?= escape($_POST['first_name'] ?? '') ?>" required>
                </div>
                <div class="form-group">
                    <label for="last_name">Last Name *</label>
                    <input type="text" id="last_name" name="last_name" value="<?= escape($_POST['last_name'] ?? '') ?>" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" value="<?= escape($_POST['email'] ?? '') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="text" id="phone" name="phone" value="<?= escape($_POST['phone'] ?? '') ?>">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <div class="form-group">
                    <label for="password_confirm">Confirm Password *</label>
                    <input type="password" id="password_confirm" name="password_confirm" required>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
            </div>
        </form>
        <div style="text-align: center; margin-top: 20px;">
            <p class="text-muted">Already have an account? <a href="/guest/login.php">Log in</a></p>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
