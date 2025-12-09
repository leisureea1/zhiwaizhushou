<?php
// 公告模型

require_once dirname(__DIR__) . '/../config/database.php';

class Announcement {
    /**
     * 获取公告列表
     */
    public static function getList($limit = 10, $offset = 0) {
        $stmt = DatabaseConfig::query(
            "SELECT a.*, u.username as author_name FROM announcements a 
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
            "SELECT a.*, u.username as author_name FROM announcements a 
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
        if (isset($data['images'])) {
            $sql = "INSERT INTO announcements (title, content, author_uid, images) VALUES (?, ?, ?, ?)";
            return DatabaseConfig::insert($sql, [
                $data['title'],
                $data['content'],
                $data['author_uid'],
                $data['images']
            ]);
        } else {
            $sql = "INSERT INTO announcements (title, content, author_uid) VALUES (?, ?, ?)";
            return DatabaseConfig::insert($sql, [
                $data['title'],
                $data['content'],
                $data['author_uid']
            ]);
        }
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
    
    /**
     * 获取所有置顶公告（不区分用户、用于全局弹窗）
     */
    public static function getPinnedAnnouncements() {
        $stmt = DatabaseConfig::query(
            "SELECT a.*, u.username as author_name 
             FROM announcements a 
             JOIN users u ON a.author_uid = u.uid 
             WHERE a.is_pinned = 1
             ORDER BY a.created_at DESC"
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 获取置顶公告列表（用户未查看过的）
     */
    public static function getPinnedAnnouncementsForUser($userUid) {
        $stmt = DatabaseConfig::query(
            "SELECT a.*, u.username as author_name 
             FROM announcements a 
             JOIN users u ON a.author_uid = u.uid 
             LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.user_uid = ?
             WHERE a.is_pinned = 1 AND av.id IS NULL
             ORDER BY a.created_at DESC",
            [$userUid]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 标记公告为已查看
     */
    public static function markAsViewed($announcementId, $userUid) {
        $sql = "INSERT IGNORE INTO announcement_views (announcement_id, user_uid) VALUES (?, ?)";
        return DatabaseConfig::insert($sql, [$announcementId, $userUid]);
    }
    
    /**
     * 设置公告置顶状态
     */
    public static function setPinned($id, $isPinned) {
        $sql = "UPDATE announcements SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        return DatabaseConfig::update($sql, [$isPinned ? 1 : 0, $id]);
    }
}