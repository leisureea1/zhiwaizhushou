<?php
// 失物招领模型

require_once dirname(__DIR__) . '/../config/database.php';

class LostFound {
    /**
     * 获取失物招领列表
     */
    public static function getList($status = null, $limit = 10, $offset = 0, $q = null, $publisherUid = null, $category = null) {
        $where = [];$params = [];
        if ($status) { $where[] = "lf.status = ?"; $params[] = $status; }
        if ($q) { $where[] = "(lf.description LIKE ? OR lf.location LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }
        if ($publisherUid) { $where[] = "lf.publisher_uid = ?"; $params[] = $publisherUid; }
        if ($category) { $where[] = "lf.category = ?"; $params[] = $category; }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        $sql = "SELECT lf.*, u.name as publisher_name, u.avatar_url as publisher_avatar FROM lost_found lf 
                JOIN users u ON lf.publisher_uid = u.uid 
                $whereSql 
                ORDER BY lf.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit; $params[] = $offset;
        $stmt = DatabaseConfig::query($sql, $params);
        
        return $stmt->fetchAll();
    }
    
    /**
     * 根据ID获取详情
     */
    public static function getById($id) {
        $stmt = DatabaseConfig::query(
            "SELECT lf.*, u.name as publisher_name, u.avatar_url as publisher_avatar FROM lost_found lf 
             JOIN users u ON lf.publisher_uid = u.uid 
             WHERE lf.id = ?",
            [$id]
        );
        return $stmt->fetch();
    }
    
    /**
     * 创建失物招领信息
     */
    public static function create($data) {
        $sql = "INSERT INTO lost_found (description, image_url, image_urls, category, location, status, publisher_uid, contact_info, wechat_qr_url, lost_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return DatabaseConfig::insert($sql, [
            $data['description'],
            $data['image_url'] ?? '',
            isset($data['image_urls']) ? json_encode($data['image_urls'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
            $data['category'] ?? null,
            $data['location'] ?? null,
            $data['status'] ?? 'lost',
            $data['publisher_uid'],
            $data['contact_info'] ?? '',
            $data['wechat_qr_url'] ?? '',
            $data['lost_time'] ?? null
        ]);
    }
    
    /**
     * 更新失物招领信息
     */
    public static function update($id, $data) {
        $sql = "UPDATE lost_found SET description = ?, image_url = ?, image_urls = ?, category = ?, location = ?, status = ?, contact_info = ?, wechat_qr_url = ?, lost_time = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?";
        return DatabaseConfig::update($sql, [
            $data['description'],
            $data['image_url'] ?? '',
            isset($data['image_urls']) ? json_encode($data['image_urls'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
            $data['category'] ?? null,
            $data['location'] ?? null,
            $data['status'],
            $data['contact_info'] ?? '',
            $data['wechat_qr_url'] ?? '',
            $data['lost_time'] ?? null,
            $id
        ]);
    }
    
    /**
     * 删除失物招领信息
     */
    public static function delete($id) {
        $sql = "DELETE FROM lost_found WHERE id = ?";
        return DatabaseConfig::delete($sql, [$id]);
    }
    
    /**
     * 获取待审核列表（后台管理）
     */
    public static function getPendingList($limit = 10, $offset = 0) {
        $sql = "SELECT lf.*, u.name as publisher_name FROM lost_found lf 
                JOIN users u ON lf.publisher_uid = u.uid 
                WHERE lf.status IN ('lost', 'found') 
                ORDER BY lf.created_at ASC LIMIT ? OFFSET ?";
        
        $stmt = DatabaseConfig::query($sql, [$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * 获取总数
     */
    public static function getCount($status = null) {
        if ($status) {
            $stmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM lost_found WHERE status = ?", [$status]);
        } else {
            $stmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM lost_found");
        }
        $result = $stmt->fetch();
        return $result['count'];
    }
}