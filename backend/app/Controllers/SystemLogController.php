<?php
// 系统日志管理控制器

require_once dirname(__DIR__) . '/Models/SystemLog.php';
require_once dirname(__DIR__) . '/Models/User.php';

class SystemLogController {
    // 统一 JSON 响应
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    /**
     * 获取系统日志列表（管理员接口）
     */
    public function getList() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        
        // 获取筛选参数
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
        $action = $_GET['action'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        
        try {
            // 构建 SQL 查询
            $where = [];
            $params = [];
            
            if ($userId) {
                $where[] = "sl.user_id = ?";
                $params[] = $userId;
            }
            
            if ($action) {
                $where[] = "sl.action = ?";
                $params[] = $action;
            }
            
            if ($startDate) {
                $where[] = "sl.created_at >= ?";
                $params[] = $startDate . ' 00:00:00';
            }
            
            if ($endDate) {
                $where[] = "sl.created_at <= ?";
                $params[] = $endDate . ' 23:59:59';
            }
            
            $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // 获取日志列表
            $sql = "SELECT sl.*, u.edu_system_username, u.name as user_name, u.avatar_url 
                    FROM system_logs sl 
                    LEFT JOIN users u ON sl.user_id = u.uid 
                    $whereSql 
                    ORDER BY sl.created_at DESC 
                    LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = DatabaseConfig::query($sql, $params);
            $logs = $stmt->fetchAll();
            
            // 获取总数
            $countSql = "SELECT COUNT(*) as count FROM system_logs sl $whereSql";
            $countParams = array_slice($params, 0, -2); // 移除 limit 和 offset
            $countStmt = DatabaseConfig::query($countSql, $countParams);
            $countResult = $countStmt->fetch();
            $total = $countResult['count'];
            
            // 绝对化头像 URL
            foreach ($logs as &$log) {
                if (!empty($log['avatar_url'])) {
                    if (!function_exists('abs_url')) {
                        function abs_url($path) {
                            if (empty($path) || preg_match('/^https?:\/\//', $path)) {
                                return $path;
                            }
                            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                            return $protocol . '://' . $host . '/' . ltrim($path, '/');
                        }
                    }
                    $log['avatar_url'] = abs_url($log['avatar_url']);
                }
            }
            
            // 不记录查看系统日志的操作，避免日志爆炸
            
            // 返回结果
            $this->jsonResponse([
                'message' => '获取系统日志成功',
                'data' => $logs,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取系统日志失败: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * 获取操作类型列表
     */
    public function getActionTypes() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        try {
            // 获取所有不同的操作类型
            $sql = "SELECT DISTINCT action FROM system_logs ORDER BY action";
            $stmt = DatabaseConfig::query($sql, []);
            $actions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $this->jsonResponse([
                'message' => '获取操作类型成功',
                'data' => $actions
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取操作类型失败: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * 获取系统统计信息
     */
    public function getStats() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        try {
            // 今日日志数
            $todaySql = "SELECT COUNT(*) as count FROM system_logs WHERE DATE(created_at) = CURDATE()";
            $todayStmt = DatabaseConfig::query($todaySql, []);
            $todayCount = $todayStmt->fetch()['count'];
            
            // 本周日志数
            $weekSql = "SELECT COUNT(*) as count FROM system_logs WHERE YEARWEEK(created_at) = YEARWEEK(NOW())";
            $weekStmt = DatabaseConfig::query($weekSql, []);
            $weekCount = $weekStmt->fetch()['count'];
            
            // 本月日志数
            $monthSql = "SELECT COUNT(*) as count FROM system_logs WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())";
            $monthStmt = DatabaseConfig::query($monthSql, []);
            $monthCount = $monthStmt->fetch()['count'];
            
            // 总日志数
            $totalSql = "SELECT COUNT(*) as count FROM system_logs";
            $totalStmt = DatabaseConfig::query($totalSql, []);
            $totalCount = $totalStmt->fetch()['count'];
            
            // 活跃用户数（今日）
            $activeUsersSql = "SELECT COUNT(DISTINCT user_id) as count FROM system_logs WHERE DATE(created_at) = CURDATE() AND user_id IS NOT NULL";
            $activeUsersStmt = DatabaseConfig::query($activeUsersSql, []);
            $activeUsersCount = $activeUsersStmt->fetch()['count'];
            
            // 最常见的操作类型（Top 10）
            $topActionsSql = "SELECT action, COUNT(*) as count FROM system_logs GROUP BY action ORDER BY count DESC LIMIT 10";
            $topActionsStmt = DatabaseConfig::query($topActionsSql, []);
            $topActions = $topActionsStmt->fetchAll();
            
            $this->jsonResponse([
                'message' => '获取系统统计成功',
                'data' => [
                    'today_logs' => $todayCount,
                    'week_logs' => $weekCount,
                    'month_logs' => $monthCount,
                    'total_logs' => $totalCount,
                    'active_users_today' => $activeUsersCount,
                    'top_actions' => $topActions
                ]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取系统统计失败: ' . $e->getMessage()], 500);
        }
    }
}
