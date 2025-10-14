<?php
// 通知服务类 - 处理各种推送通知

require_once dirname(__DIR__) . '/../config/database.php';

class NotificationService {
    
    /**
     * 获取配置值
     */
    private static function getSetting($key, $default = '') {
        try {
            $stmt = DatabaseConfig::query(
                "SELECT setting_value FROM notification_settings WHERE setting_key = ?",
                [$key]
            );
            $result = $stmt->fetch();
            return $result ? $result['setting_value'] : $default;
        } catch (Exception $e) {
            error_log("[NotificationService] Failed to get setting: {$key}, error: " . $e->getMessage());
            return $default;
        }
    }
    
    /**
     * 保存配置值
     */
    public static function saveSetting($key, $value) {
        try {
            $sql = "INSERT INTO notification_settings (setting_key, setting_value) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()";
            return DatabaseConfig::query($sql, [$key, $value, $value]);
        } catch (Exception $e) {
            error_log("[NotificationService] Failed to save setting: {$key}, error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 获取所有配置
     */
    public static function getAllSettings() {
        try {
            $stmt = DatabaseConfig::query("SELECT * FROM notification_settings ORDER BY setting_key");
            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("[NotificationService] Failed to get all settings, error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * 发送 Bark 通知
     * 
     * @param string $title 通知标题
     * @param string $body 通知内容
     * @param array $options 额外选项 (url, group, sound, icon 等)
     * @return bool 是否发送成功
     */
    public static function sendBarkNotification($title, $body, $options = []) {
        // 检查是否启用 Bark
        $enabled = self::getSetting('bark_enabled', '0');
        if ($enabled !== '1') {
            error_log("[NotificationService] Bark is disabled");
            return false;
        }
        
        // 获取 Bark 配置
        $barkKey = self::getSetting('bark_key', '');
        if (empty($barkKey)) {
            error_log("[NotificationService] Bark key is not configured");
            return false;
        }
        
        $barkServer = self::getSetting('bark_server', 'https://api.day.app');
        $defaultSound = self::getSetting('bark_sound', 'bell');
        $defaultGroup = self::getSetting('bark_group', '校园小程序');
        
        // 构建 Bark URL
        $url = rtrim($barkServer, '/') . '/' . $barkKey;
        
        // 准备请求数据
        $data = [
            'title' => $title,
            'body' => $body,
            'sound' => $options['sound'] ?? $defaultSound,
            'group' => $options['group'] ?? $defaultGroup,
        ];
        
        // 添加可选参数
        if (isset($options['url'])) {
            $data['url'] = $options['url'];
        }
        if (isset($options['icon'])) {
            $data['icon'] = $options['icon'];
        }
        if (isset($options['badge'])) {
            $data['badge'] = $options['badge'];
        }
        if (isset($options['level'])) {
            $data['level'] = $options['level']; // active, timeSensitive, passive
        }
        
        // 发送 POST 请求
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json; charset=utf-8'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($httpCode === 200) {
                error_log("[NotificationService] Bark notification sent successfully: {$title}");
                return true;
            } else {
                error_log("[NotificationService] Bark notification failed, HTTP code: {$httpCode}, response: {$response}, error: {$error}");
                return false;
            }
        } catch (Exception $e) {
            error_log("[NotificationService] Bark notification exception: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 通知管理员有新的跳蚤市场商品发布
     */
    public static function notifyFleaMarketItemCreated($itemId, $title, $publisherName) {
        // 检查是否启用跳蚤市场通知
        $enabled = self::getSetting('bark_notify_flea_market', '1');
        if ($enabled !== '1') {
            return false;
        }
        
        $notificationTitle = '新的跳蚤市场商品';
        $notificationBody = "用户「{$publisherName}」发布了新商品：{$title}";
        
        // 获取服务器地址构建管理后台链接
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $adminUrl = "{$protocol}://{$host}/admin#marketplace";
        
        // 使用配置的声音，不硬编码
        $sound = self::getSetting('bark_sound', 'bell');
        
        return self::sendBarkNotification($notificationTitle, $notificationBody, [
            'url' => $adminUrl,
            'sound' => $sound,
            'level' => 'timeSensitive'
        ]);
    }
    
    /**
     * 通知管理员有新的失物招领发布
     */
    public static function notifyLostFoundItemCreated($itemId, $title, $publisherName, $type) {
        // 检查是否启用失物招领通知
        $enabled = self::getSetting('bark_notify_lost_found', '1');
        if ($enabled !== '1') {
            return false;
        }
        
        $typeText = $type === 'lost' ? '失物' : '招领';
        $notificationTitle = "新的{$typeText}信息";
        $notificationBody = "用户「{$publisherName}」发布了新的{$typeText}：{$title}";
        
        // 获取服务器地址构建管理后台链接
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $adminUrl = "{$protocol}://{$host}/admin#lostfound";
        
        // 从数据库读取配置的提示音
        $sound = self::getSetting('bark_sound', 'bell');
        
        return self::sendBarkNotification($notificationTitle, $notificationBody, [
            'url' => $adminUrl,
            'sound' => $sound,
            'level' => 'timeSensitive'
        ]);
    }
    
    /**
     * 测试 Bark 通知
     */
    public static function testBarkNotification() {
        return self::sendBarkNotification(
            '测试通知',
            '这是一条来自校园小程序后台的测试通知',
            ['sound' => 'anticipate']
        );
    }
}
