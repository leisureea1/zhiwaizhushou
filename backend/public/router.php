<?php
// 路由文件，确保所有请求都通过index.php处理
if (file_exists(__DIR__ . $_SERVER['REQUEST_URI'])) {
    // 如果请求的文件存在，直接返回该文件
    return false;
} else {
    // 否则，将请求传递给index.php处理
    require_once __DIR__ . '/index.php';
}