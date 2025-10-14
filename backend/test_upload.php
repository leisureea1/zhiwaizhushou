<?php
// 测试文件上传接收

header('Content-Type: application/json');

echo json_encode([
    'message' => '测试上传接收',
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? '',
    'FILES' => $_FILES,
    'POST' => $_POST,
    'GET' => $_GET,
    'php_input_length' => strlen(file_get_contents('php://input')),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size')
]);
