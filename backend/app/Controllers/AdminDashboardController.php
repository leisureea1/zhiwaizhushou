<?php
// 管理员仪表板控制器

require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class AdminDashboardController {
    /**
     * 获取仪表板统计数据
     */
    public function getStats() {
        try {
            // 获取用户总数
            $userCountStmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM users");
            $userCount = $userCountStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // 获取公告总数
            $announcementCountStmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM announcements");
            $announcementCount = $announcementCountStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // 获取商品总数
            $itemCountStmt = DatabaseConfig::query("SELECT COUNT(*) as count FROM flea_market");
            $itemCount = $itemCountStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // 返回成功响应
            echo json_encode([
                'user_count' => $userCount,
                'announcement_count' => $announcementCount,
                'item_count' => $itemCount
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取统计数据失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 获取最近公告
     */
    public function getRecentAnnouncements() {
        try {
            // 获取最近5条公告
            $announcementsStmt = DatabaseConfig::query("SELECT id, title, created_at FROM announcements ORDER BY created_at DESC LIMIT 5");
            $announcements = $announcementsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 返回成功响应
            echo json_encode([
                'announcements' => $announcements
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取最近公告失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 获取待审核商品
     */
    public function getPendingItems() {
        try {
            // 获取最近5条待审核商品
            $itemsStmt = DatabaseConfig::query("SELECT id, title, created_at FROM flea_market WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5");
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 返回成功响应
            echo json_encode([
                'items' => $items
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取待审核商品失败: ' . $e->getMessage()]);
        }
    }
}