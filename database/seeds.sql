-- 插入示例用户数据
INSERT INTO users (student_id, name, password_hash, edu_system_username, edu_system_password, role, email, email_verified) VALUES
('2021001', '张三', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'zhangsan_edu', 'edu_password123', 'user', 'zhangsan@example.com', TRUE),
('2021002', '李四', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lisi_edu', 'edu_password456', 'user', 'lisi@example.com', TRUE),
('2021003', '管理员', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NULL, 'admin', 'admin@example.com', TRUE);

-- 插入示例公告数据
INSERT INTO announcements (title, content, author_uid) VALUES
('新学期开学通知', '各位同学，新学期将于9月1日正式开学，请大家按时到校报到。', 3),
('图书馆闭馆通知', '因设备维护，图书馆将于本周六全天闭馆，望周知。', 3);

-- 插入示例跳蚤市场数据
INSERT INTO flea_market (title, description, price, image_url, publisher_uid, status) VALUES
('二手笔记本电脑', '联想ThinkPad，2020年购买，性能良好', 1500.00, '/images/laptop.jpg', 1, 'approved'),
('专业书籍出售', '多本计算机专业书籍，几乎全新', 200.00, '/images/books.jpg', 2, 'approved');

-- 插入示例失物招领数据
INSERT INTO lost_found (description, image_url, status, publisher_uid, contact_info) VALUES
('丢失黑色钱包', '/images/wallet.jpg', 'lost', 1, '电话：13800138000'),
('捡到钥匙串', '/images/keys.jpg', 'found', 2, '请联系学生会办公室');

-- 更新SMTP配置为实际可用的示例数据
UPDATE smtp_config SET 
    host = 'smtp.example.com',
    port = 587,
    username = 'test@example.com',
    password = 'testpassword',
    encryption = 'tls'
WHERE id = 1;