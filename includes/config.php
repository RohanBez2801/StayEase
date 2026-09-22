<?php
// includes/config.php

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'stayease');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application configuration
define('APP_NAME', 'StayEase - Book with Shipiki');
define('TAX_RATE', 0.15);
define('LONG_STAY_DISCOUNT_RATE', 0.10);
define('LONG_STAY_MIN_NIGHTS', 4); // >3 nights means 4 or more

// Security
define('SESSION_LIFETIME', 86400); // 1 day
