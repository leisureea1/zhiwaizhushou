<?php
// 用户模型

require_once dirname(__DIR__) . '/../config/database.php';

class User {
    /**
     * 根据学号查找用户
     */
    public static function findByStudentId($studentId) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE student_id = ?",
            [$studentId]
        );
        return $stmt->fetch();
    }
    
    /**
     * 根据邮箱查找用户
     */
    public static function findByEmail($email) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM users WHERE email = ?",
            [$email]
        );
        return $stmt->fetch();
    }
    
    /**
     * 根据用户名查找用户
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
        $sql = "INSERT INTO users (student_id, name, password_hash, edu_system_username, edu_system_password, email) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        return DatabaseConfig::insert($sql, [
            $data['student_id'],
            $data['name'],
            $data['password_hash'],
            $data['edu_system_username'],
            $data['edu_system_password'],
            $data['email']
        ]);
    }
    
    /**
     * 更新用户邮箱验证状态
     */
    public static function updateEmailVerification($uid, $verified = true) {
        $sql = "UPDATE users SET email_verified = ? WHERE uid = ?";
        return DatabaseConfig::update($sql, [$verified ? 1 : 0, $uid]);
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
            "SELECT uid, student_id, name, email, role, email_verified, created_at FROM users 
             ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [$limit, $offset]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 更新用户角色
     */
    public static function updateRole($uid, $role) {
        $sql = "UPDATE users SET role = ? WHERE uid = ?";
        return DatabaseConfig::update($sql, [$role, $uid]);
    }
}