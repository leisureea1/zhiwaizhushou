-- 用户表
CREATE TABLE users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    edu_system_username VARCHAR(50),
    edu_system_password TEXT,
    role ENUM('user', 'admin') DEFAULT 'user',
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 公告表
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_uid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- 跳蚤市场表
CREATE TABLE flea_market (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(255),
    publisher_uid INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- 失物招领表
CREATE TABLE lost_found (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT NOT NULL,
    image_url VARCHAR(255),
    status ENUM('lost', 'found') DEFAULT 'lost',
    publisher_uid INT NOT NULL,
    contact_info VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- SMTP配置表
CREATE TABLE smtp_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host VARCHAR(100) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    encryption ENUM('tls', 'ssl', '') DEFAULT 'tls',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 日志表
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL
);

-- 插入默认SMTP配置
INSERT INTO smtp_config (host, port, username, password, encryption) VALUES 
('smtp.gmail.com', 587, 'your_email@gmail.com', 'your_password', 'tls');