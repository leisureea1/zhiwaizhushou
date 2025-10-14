<?php
// 通知管理控制器

require_once dirname(__DIR__) . '/Services/NotificationService.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class NotificationController {
    
    /**
     * 获取所有通知配置
     */
    public function getSettings() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => '未登录或会话已过期']);
            return;
        }
        
        try {
            $settings = NotificationService::getAllSettings();
            
            // 转换为键值对格式
            $settingsMap = [];
            foreach ($settings as $setting) {
                $settingsMap[$setting['setting_key']] = [
                    'value' => $setting['setting_value'],
                    'description' => $setting['description']
                ];
            }
            
            echo json_encode([
                'message' => '获取通知配置成功',
                'data' => $settingsMap
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取通知配置失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 更新通知配置
     */
    public function updateSettings() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => '未登录或会话已过期']);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取 POST 数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['settings'])) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        try {
            $settings = $input['settings'];
            $updated = [];
            
            // 更新每个配置项
            foreach ($settings as $key => $value) {
                if (NotificationService::saveSetting($key, $value)) {
                    $updated[] = $key;
                }
            }
            
            // 记录日志
            SystemLog::log($adminUserId, 'notification_settings_updated', '更新通知配置: ' . implode(', ', $updated));
            
            echo json_encode([
                'message' => '通知配置更新成功',
                'updated' => $updated
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新通知配置失败: ' . $e->getMessage()]);
            SystemLog::log($adminUserId ?? null, 'notification_settings_update_error', '更新通知配置失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 测试 Bark 通知
     */
    public function testBark() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => '未登录或会话已过期']);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        try {
            $result = NotificationService::testBarkNotification();
            
            if ($result) {
                SystemLog::log($adminUserId, 'bark_test_success', '测试 Bark 通知成功');
                echo json_encode([
                    'message' => 'Bark 通知测试成功，请检查你的设备',
                    'success' => true
                ]);
            } else {
                SystemLog::log($adminUserId, 'bark_test_failed', '测试 Bark 通知失败');
                echo json_encode([
                    'message' => 'Bark 通知测试失败，请检查配置是否正确',
                    'success' => false
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Bark 通知测试失败: ' . $e->getMessage()]);
            SystemLog::log($adminUserId ?? null, 'bark_test_error', 'Bark 通知测试异常: ' . $e->getMessage());
        }
    }
}
