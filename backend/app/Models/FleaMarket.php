<?php
// 跳蚤市场模型

require_once dirname(__DIR__) . '/../config/database.php';

class FleaMarket {
    /**
     * 获取商品列表
     */
    public static function getList($status = 'approved', $limit = 10, $offset = 0) {
        $sql = "SELECT fm.*, u.name as publisher_name FROM flea_market fm 
                JOIN users u ON fm.publisher_uid = u.uid 
                WHERE fm.status = ? 
                ORDER BY fm.created_at DESC LIMIT ? OFFSET ?";
        
        $stmt = DatabaseConfig::query($sql, [$status, $limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * 根据ID获取商品详情
     */
    public static function getById($id) {
        $stmt = DatabaseConfig::query(
            "SELECT fm.*, u.name as publisher_name FROM flea_market fm 
             JOIN users u ON fm.publisher_uid = u.uid 
             WHERE fm.id = ?",
            [$id]
        );
        return $stmt->fetch();
    }
    
    /**
     * 创建商品
     */
    public static function create($data) {
        $sql = "INSERT INTO flea_market (title, description, price, image_url, publisher_uid) 
                VALUES (?, ?, ?, ?, ?)";
        return DatabaseConfig::insert($sql, [
            $data['title'],
            $data['description'],
            $data['price'],
            $data['image_url'] ?? '',
            $data['publisher_uid']
        ]);
    }
    
    /**
     * 更新商品
     */
    public static function update($id, $data) {
        $sql = "UPDATE flea_market SET title = ?, description = ?, price = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?";
        return DatabaseConfig::update($sql, [
            $data['title'],
            $data['description'],
            $data['price'],
            $data['image_url'] ?? '',
            $id
        ]);
    }
    
    /**
     * 更新商品状态（审核）
     */
    public static function updateStatus($id, $status) {
        $sql = "UPDATE flea_market SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        return DatabaseConfig::update($sql, [$status, $id]);
    }
    
    /**
     * 删除商品
     */
    public static function delete($id) {
        $sql = "DELETE FROM flea_market WHERE id = ?";
        return DatabaseConfig::delete($sql, [$id]);
    }
    
    /**
     * 获取待审核商品列表（后台管理）
     */
    public static function getPendingList($limit = 10, $offset = 0) {
        $sql = "SELECT fm.*, u.name as publisher_name FROM flea_market fm 
                JOIN users u ON fm.publisher_uid = u.uid 
                WHERE fm.status = 'pending' 
                ORDER BY fm.created_at ASC LIMIT ? OFFSET ?";
        
        $stmt = DatabaseConfig::query($sql, [$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * 获取商品总数
     */
    public static function getCount($status = 'approved') {
        $stmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM flea_market WHERE status = ?", [$status]);
        $result = $stmt->fetch();
        return $result['count'];
    }
}