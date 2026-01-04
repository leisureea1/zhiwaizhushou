-- ============================================
-- 西外校园小程序数据库初始化脚本
-- ============================================

-- 建议先确保库本身为 utf8mb4
-- ALTER DATABASE `xisu` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户账号',
    name VARCHAR(50) NOT NULL COMMENT '真实姓名(从教务系统获取)',
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    edu_system_username VARCHAR(50) COMMENT '教务系统学号',
    edu_system_password TEXT COMMENT '教务系统密码',
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) NULL COMMENT '最后登录IP'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 公告表
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    images TEXT NULL COMMENT '公告图片URLs的JSON数组',
    author_uid INT NOT NULL,
    is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶: 0-否 1-是',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 公告查看记录表（避免重复弹窗）
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_uid INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_view (announcement_id, user_uid),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 跳蚤市场表
-- ============================================
CREATE TABLE IF NOT EXISTS flea_market (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50),
    condition_level VARCHAR(20),
    image_url VARCHAR(255),
    image_urls TEXT,
    location VARCHAR(100),
    contact_info VARCHAR(100),
    wechat_qr_url VARCHAR(255),
    publisher_uid INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 失物招领表
-- ============================================
CREATE TABLE IF NOT EXISTS lost_found (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT NOT NULL,
    image_url VARCHAR(255),
    image_urls TEXT,
    category VARCHAR(50),
    location VARCHAR(100),
    lost_time VARCHAR(100),
    status ENUM('lost', 'found') DEFAULT 'lost',
    publisher_uid INT NOT NULL,
    contact_info VARCHAR(100),
    wechat_qr_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 系统日志表
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 通知配置表
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键名',
    setting_value TEXT COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知配置表';

-- ============================================
-- 功能开关配置表
-- ============================================
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

-- ============================================
-- 初始数据
-- ============================================

-- 通知配置默认值
INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
('bark_enabled', '0', '是否启用 Bark 通知（0=禁用，1=启用）'),
('bark_key', '', 'Bark 推送 Key'),
('bark_server', 'https://api.day.app', 'Bark 服务器地址'),
('bark_notify_flea_market', '1', '跳蚤市场发布时通知（0=否，1=是）'),
('bark_notify_lost_found', '1', '失物招领发布时通知（0=否，1=是）'),
('bark_sound', 'bell', 'Bark 通知声音'),
('bark_group', '校园小程序', 'Bark 通知分组')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 功能开关默认值
INSERT INTO feature_settings (feature_key, is_enabled, feature_name, description, offline_message) VALUES
('flea_market', 1, '跳蚤市场', '校园二手交易平台', '跳蚤市场功能已下线'),
('lost_found', 1, '失物招领', '校园失物招领平台', '失物招领功能已下线')
ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP;
