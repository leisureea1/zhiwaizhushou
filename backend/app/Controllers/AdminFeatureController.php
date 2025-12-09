<?php
namespace App\Controllers;

class AdminFeatureController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * 获取所有功能配置列表
     */
    public function getFeatureList()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT id, feature_key, is_enabled, feature_name, description, offline_message, updated_at
                FROM feature_settings 
                ORDER BY id ASC
            ");
            $stmt->execute();
            $features = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // 转换布尔值
            foreach ($features as &$feature) {
                $feature['is_enabled'] = (bool)$feature['is_enabled'];
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $features
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            error_log('获取功能配置列表失败: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '获取功能配置列表失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 更新功能配置
     */
    public function updateFeature()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '缺少功能ID'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $id = $data['id'];
            $isEnabled = isset($data['is_enabled']) ? (int)$data['is_enabled'] : null;
            $offlineMessage = $data['offline_message'] ?? null;

            // 构建更新语句
            $updateFields = [];
            $params = [];

            if ($isEnabled !== null) {
                $updateFields[] = "is_enabled = ?";
                $params[] = $isEnabled;
            }

            if ($offlineMessage !== null) {
                $updateFields[] = "offline_message = ?";
                $params[] = $offlineMessage;
            }

            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '没有需要更新的字段'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $params[] = $id;
            $sql = "UPDATE feature_settings SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // 记录日志
            error_log("管理员更新功能配置: ID={$id}");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => '更新成功'
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            error_log('更新功能配置失败: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '更新功能配置失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 批量切换功能状态
     */
    public function toggleFeature()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['feature_key']) || !isset($data['is_enabled'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '缺少必要参数'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $featureKey = $data['feature_key'];
            $isEnabled = (int)$data['is_enabled'];

            $stmt = $this->db->prepare("
                UPDATE feature_settings 
                SET is_enabled = ? 
                WHERE feature_key = ?
            ");
            $stmt->execute([$isEnabled, $featureKey]);

            // 记录日志
            $status = $isEnabled ? '开启' : '关闭';
            error_log("管理员{$status}功能: {$featureKey}");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => '切换成功'
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            error_log('切换功能状态失败: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '切换功能状态失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
