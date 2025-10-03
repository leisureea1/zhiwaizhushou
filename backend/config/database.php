<?php
// 数据库配置文件

class DatabaseConfig {
    // 数据库连接配置
    const DB_HOST = 'localhost';
    const DB_PORT = 3306;
    const DB_NAME = 'xisu';
    const DB_USER = 'root';
    const DB_PASS = '';
    
    private static $pdo = null;
    
    /**
     * 获取数据库连接
     */
    public static function getConnection() {
        if (self::$pdo === null) {
            try {
                $dsn = 'mysql:host=' . self::DB_HOST . ';port=' . self::DB_PORT . ';dbname=' . self::DB_NAME . ';charset=utf8mb4';
                self::$pdo = new PDO($dsn, self::DB_USER, self::DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                throw new Exception('数据库连接失败: ' . $e->getMessage());
            }
        }
        
        return self::$pdo;
    }
    
    /**
     * 执行查询
     */
    public static function query($sql, $params = []) {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * 执行插入操作
     */
    public static function insert($sql, $params = []) {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return self::getConnection()->lastInsertId();
    }
    
    /**
     * 执行更新操作
     */
    public static function update($sql, $params = []) {
        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * 执行删除操作
     */
    public static function delete($sql, $params = []) {
        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute($params);
    }
}