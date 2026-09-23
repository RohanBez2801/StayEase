<?php
// Simple script to render the schema for screenshotting
require_once 'includes/config.php';
require_once 'includes/database.php';

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo '<!DOCTYPE html><html><head><title>Database Schema</title>';
echo '<link rel="stylesheet" href="assets/css/style.css">';
echo '<style>
    body { background-color: #f4f5f7; padding: 40px; font-family: "Georgia", serif; }
    .schema-container { display: flex; flex-wrap: wrap; gap: 20px; }
    .table-card { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; width: 400px; }
    h2 { color: #1a4731; border-bottom: 2px solid #a87b4f; padding-bottom: 10px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-family: "Inter", sans-serif; }
    th { background: #1a4731; color: white; padding: 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
</style>';
echo '</head><body>';
echo '<h1 style="color: #1a4731; text-align: center; margin-bottom: 30px;">StayEase Database Schema</h1>';
echo '<div class="schema-container">';

foreach ($tables as $table) {
    echo '<div class="table-card">';
    echo '<h2>' . htmlspecialchars($table) . '</h2>';
    echo '<table><tr><th>Field</th><th>Type</th><th>Key</th></tr>';
    $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo '<tr>';
        echo '<td><strong>' . htmlspecialchars($col['Field']) . '</strong></td>';
        echo '<td>' . htmlspecialchars($col['Type']) . '</td>';
        echo '<td>' . htmlspecialchars($col['Key']) . '</td>';
        echo '</tr>';
    }
    echo '</table></div>';
}

echo '</div></body></html>';
?>
