<?php
namespace App\Controllers;

class FeatureController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * 获取所有功能配置状态（小程序启动时调用）
     */
    public function getFeatureSettings()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT feature_key, is_enabled, offline_message 
                FROM feature_settings 
                ORDER BY id ASC
            ");
            $stmt->execute();
            $features = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // 转换为键值对格式，方便小程序使用
            $result = [];
            foreach ($features as $feature) {
                $result[$feature['feature_key']] = [
                    'enabled' => (bool)$feature['is_enabled'],
                    'message' => $feature['offline_message']
                ];
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            error_log('获取功能配置失败: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '获取功能配置失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 检查单个功能是否启用
     */
    public function checkFeature($featureKey)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT is_enabled, offline_message 
                FROM feature_settings 
                WHERE feature_key = ?
            ");
            $stmt->execute([$featureKey]);
            $feature = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$feature) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => '功能不存在'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'enabled' => (bool)$feature['is_enabled'],
                    'message' => $feature['offline_message']
                ]
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            error_log('检查功能状态失败: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '检查功能状态失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
