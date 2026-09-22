<?php
require_once __DIR__ . '/../includes/auth.php';

if (isLoggedIn()) {
    redirect('/');
}

$page_title = 'Login';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = "Please enter your email and password.";
    } else {
        if (attemptLogin($email, $password)) {
            if (isAdmin()) {
                redirect('/admin/index.php');
            } else {
                redirect('/');
            }
        } else {
            $error = "Invalid email or password.";
        }
    }
}
require_once __DIR__ . '/../includes/header.php';
?>

<div class="card" style="max-width: 400px; margin: 0 auto; margin-top: 40px;">
    <div class="card-header">
        <h2>Login</h2>
    </div>
    <div class="card-body">
        <?php if ($error): ?>
            <div class="alert alert-danger" style="margin-bottom: 20px; color: #9b2c2c; background-color: #fed7d7; padding: 12px; border-radius: 4px;">
                <?= escape($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <input type="hidden" name="csrf_token" value="<?= escape($csrf_token) ?>">
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="<?= escape($_POST['email'] ?? '') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Log In</button>
            </div>
        </form>
        <div style="text-align: center; margin-top: 20px;">
            <p class="text-muted">Don't have an account? <a href="/guest/register.php">Register</a></p>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
