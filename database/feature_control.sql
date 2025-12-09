-- 功能开关配置表
CREATE TABLE IF NOT EXISTS feature_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_key VARCHAR(100) UNIQUE NOT NULL COMMENT '功能键名',
    is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用（0=关闭，1=开启）',
    feature_name VARCHAR(100) NOT NULL COMMENT '功能名称',
    description VARCHAR(255) COMMENT '功能描述',
    offline_message VARCHAR(255) COMMENT '关闭时的提示信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='功能开关配置表';

-- 插入默认功能配置
INSERT INTO feature_settings (feature_key, is_enabled, feature_name, description, offline_message) VALUES
('flea_market', 1, '跳蚤市场', '校园二手交易平台', '跳蚤市场功能已下线'),
('lost_found', 1, '失物招领', '校园失物招领平台', '失物招领功能已下线')
ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP;
