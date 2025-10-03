<?php
// 系统日志模型

require_once dirname(__DIR__) . '/../config/database.php';

class SystemLog {
    /**
     * 记录日志
     */
    public static function log($userId, $action, $description = '', $ipAddress = null, $userAgent = null) {
        $sql = "INSERT INTO system_logs (user_id, action, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)";
        return DatabaseConfig::insert($sql, [
            $userId ?: null,
            $action,
            $description,
            $ipAddress ?: self::getClientIP(),
            $userAgent ?: ($_SERVER['HTTP_USER_AGENT'] ?? '')
        ]);
    }
    
    /**
     * 获取日志列表
     */
    public static function getList($limit = 10, $offset = 0) {
        $sql = "SELECT sl.*, u.student_id, u.name as user_name FROM system_logs sl 
                LEFT JOIN users u ON sl.user_id = u.uid 
                ORDER BY sl.created_at DESC LIMIT ? OFFSET ?";
        $stmt = DatabaseConfig::query($sql, [$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * 根据用户ID获取日志
     */
    public static function getByUserId($userId, $limit = 10, $offset = 0) {
        $sql = "SELECT sl.*, u.student_id, u.name as user_name FROM system_logs sl 
                LEFT JOIN users u ON sl.user_id = u.uid 
                WHERE sl.user_id = ? 
                ORDER BY sl.created_at DESC LIMIT ? OFFSET ?";
        $stmt = DatabaseConfig::query($sql, [$userId, $limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * 获取客户端IP地址
     */
    private static function getClientIP() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        return $ip;
    }
    
    /**
     * 获取日志总数
     */
    public static function getCount() {
        $stmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM system_logs");
        $result = $stmt->fetch();
        return $result['count'];
    }
}