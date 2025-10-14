<?php
// 临时迁移脚本：添加 images 字段到 announcements 表

require_once __DIR__ . '/config/database.php';

try {
    $pdo = DatabaseConfig::getConnection();
    
    // 检查字段是否已存在
    $stmt = $pdo->query("SHOW COLUMNS FROM announcements LIKE 'images'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "✓ images 字段已存在，无需迁移\n";
        exit(0);
    }
    
    // 添加 images 字段
    $sql = "ALTER TABLE announcements 
            ADD COLUMN images TEXT NULL COMMENT '公告图片URLs的JSON数组' 
            AFTER content";
    
    $pdo->exec($sql);
    
    echo "✓ 迁移成功：已在 announcements 表中添加 images 字段\n";
    echo "✓ 现在可以创建带图片的公告了！\n";
    
} catch (PDOException $e) {
    echo "✗ 迁移失败: " . $e->getMessage() . "\n";
    exit(1);
}
