-- 为公告表添加置顶功能
ALTER TABLE announcements ADD COLUMN is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶: 0-否 1-是';

-- 创建公告查看记录表（避免重复弹窗）
CREATE TABLE announcement_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_uid INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_view (announcement_id, user_uid),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;