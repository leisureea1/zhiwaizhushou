<?php
// 用户模型

require_once dirname(__DIR__) . '/../config/database.php';

class User {
    /**
     * 根据用户名查找用户
     */
    public static function findByUsername($username) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE username = ?",
            [$username]
        );
        return $stmt->fetch();
    }

    /**
     * 根据教务系统账号查找用户
     */
    public static function findByEduSystemUsername($eduSystemUsername) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE edu_system_username = ?",
            [$eduSystemUsername]
        );
        return $stmt->fetch();
    }
    
    /**
     * 根据真实姓名查找用户
     */
    public static function findByName($name) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE name = ?",
            [$name]
        );
        return $stmt->fetch();
    }
    
    /**
     * 根据UID查找用户
     */
    public static function findById($uid) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE uid = ?",
            [$uid]
        );
        return $stmt->fetch();
    }
    
    /**
     * 创建新用户
     */
    public static function create($data) {
        $sql = "INSERT INTO users (username, name, password_hash, avatar_url, edu_system_username, edu_system_password) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        return DatabaseConfig::insert($sql, [
            $data['username'],
            $data['name'],
            $data['password_hash'],
            $data['avatar_url'] ?? null,
            $data['edu_system_username'],
            $data['edu_system_password']
        ]);
    }
    
    /**
     * 更新用户密码
     */
    public static function updatePassword($uid, $passwordHash) {
        $sql = "UPDATE users SET password_hash = ? WHERE uid = ?";
        return DatabaseConfig::update($sql, [$passwordHash, $uid]);
    }
    
    /**
     * 获取所有用户（用于后台管理）
     */
    public static function getAllUsers($limit = 10, $offset = 0) {
        $stmt = DatabaseConfig::query(
            "SELECT uid, username, name, role, edu_system_username, created_at, last_login_at, last_login_ip FROM users 
             ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [$limit, $offset]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 更新用户角色
     */
    
    /**
     * 更新用户角色
     */
    public static function updateRole($uid, $role) {
        $sql = "UPDATE users SET role = ? WHERE uid = ?";
        return DatabaseConfig::update($sql, [$role, $uid]);
    }

    /**
     * 更新用户头像
     */
    public static function updateAvatar($uid, $avatarUrl) {
        $sql = "UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?";
        return DatabaseConfig::update($sql, [$avatarUrl, $uid]);
    }

    /**
     * 更新用户信息
     */
    public static function updateUserInfo($uid, $data) {
        $sql = "UPDATE users SET 
                username = ?, 
                name = ?, 
                edu_system_username = ?, 
                edu_system_password = ?,
                updated_at = CURRENT_TIMESTAMP 
                WHERE uid = ?";
        return DatabaseConfig::update($sql, [
            $data['username'],
            $data['name'],
            $data['edu_system_username'],
            $data['edu_system_password'],
            $uid
        ]);
    }

    /**
     * 更新登录信息（登录时间和IP）
     */
    public static function updateLoginInfo($uid, $loginIp) {
        $sql = "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = ? WHERE uid = ?";
        return DatabaseConfig::update($sql, [$loginIp, $uid]);
    }

    /**
     * 删除用户
     */
    public static function deleteById($uid) {
        $sql = "DELETE FROM users WHERE uid = ?";
        return DatabaseConfig::delete($sql, [$uid]);
    }

    /**
     * 获取用户总数
     */
    public static function getCount() {
        $stmt = DatabaseConfig::query("SELECT COUNT(*) as total FROM users");
        $result = $stmt->fetch();
        return (int)($result['total'] ?? 0);
    }
}