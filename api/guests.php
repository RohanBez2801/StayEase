<?php
// api/guests.php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // We mock the guest 'idNumber' since it wasn't in our schema, but for compatibility we'll send id as a string
    $stmt = $pdo->query("
        SELECT id, CONCAT(first_name, ' ', last_name) as name, phone, email, CONCAT('G-', id) as idNumber
        FROM users 
        WHERE role = 'guest'
        ORDER BY first_name ASC
    ");
    $guests = $stmt->fetchAll();
    
    // Add prefix for JS compatibility
    foreach ($guests as &$guest) {
        $guest['id'] = 'G-' . str_pad($guest['id'], 3, '0', STR_PAD_LEFT);
    }
    
    echo json_encode(['success' => true, 'data' => $guests]);
} 
elseif ($method === 'POST') {
    requireCsrfToken();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action']) && $data['action'] === 'save') {
        $nameParts = explode(' ', $data['name'] ?? '', 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        $phone = $data['phone'] ?? '';
        $email = $data['email'] ?? '';
        // Ignore idNumber for saving as we don't store it in our simplified schema
        
        $editingId = $data['id'] ?? null;
        if ($editingId) {
            $dbId = (int)str_replace('G-', '', $editingId);
            $stmt = $pdo->prepare("UPDATE users SET first_name=?, last_name=?, phone=?, email=? WHERE id=? AND role='guest'");
            $stmt->execute([$firstName, $lastName, $phone, $email, $dbId]);
        } else {
            // New guest added by admin, generate random password
            $hash = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, 'guest')");
            try {
                $stmt->execute([$firstName, $lastName, $email, $phone, $hash]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'error' => 'Email might already be in use.']);
                exit;
            }
        }
        echo json_encode(['success' => true]);
    }
}
elseif ($method === 'DELETE') {
    requireCsrfToken();
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? '';
    $dbId = (int)str_replace('G-', '', $id);
    
    $stmt = $pdo->prepare("SELECT id FROM bookings WHERE user_id = ?");
    $stmt->execute([$dbId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Cannot delete guest because they have historical or active bookings.']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role='guest'");
    $stmt->execute([$dbId]);
    echo json_encode(['success' => true]);
}
