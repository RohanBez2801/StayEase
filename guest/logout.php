<?php
require_once __DIR__ . '/../includes/auth.php';

session_unset();
session_destroy();
session_start();

setFlashMessage("You have been successfully logged out.", "success");
redirect('/');
