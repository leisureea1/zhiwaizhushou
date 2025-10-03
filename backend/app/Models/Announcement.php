<?php
// 公告模型

require_once dirname(__DIR__) . '/../config/database.php';

class Announcement {
    /**
     * 获取公告列表
     */
    public static function getList($limit = 10, $offset = 0) {
        $stmt = DatabaseConfig::query(
            "SELECT a.*, u.name as author_name FROM announcements a 
             JOIN users u ON a.author_uid = u.uid 
             ORDER BY a.created_at DESC LIMIT ? OFFSET ?",
            [$limit, $offset]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 根据ID获取公告详情
     */
    public static function getById($id) {
        $stmt = DatabaseConfig::query(
            "SELECT a.*, u.name as author_name FROM announcements a 
             JOIN users u ON a.author_uid = u.uid 
             WHERE a.id = ?",
            [$id]
        );
        return $stmt->fetch();
    }
    
    /**
     * 创建公告
     */
    public static function create($data) {
        $sql = "INSERT INTO announcements (title, content, author_uid) VALUES (?, ?, ?)";
        return DatabaseConfig::insert($sql, [
            $data['title'],
            $data['content'],
            $data['author_uid']
        ]);
    }
    
    /**
     * 更新公告
     */
    public static function update($id, $data) {
        $sql = "UPDATE announcements SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        return DatabaseConfig::update($sql, [
            $data['title'],
            $data['content'],
            $id
        ]);
    }
    
    /**
     * 删除公告
     */
    public static function delete($id) {
        $sql = "DELETE FROM announcements WHERE id = ?";
        return DatabaseConfig::delete($sql, [$id]);
    }
    
    /**
     * 获取公告总数
     */
    public static function getCount() {
        $stmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM announcements");
        $result = $stmt->fetch();
        return $result['count'];
    }
}