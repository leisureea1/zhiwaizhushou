<?php
// 评教控制器

require_once dirname(__DIR__) . '/Services/JwxtApiService.php';

class EvaluationController {
    /**
     * 获取待评教课程列表
     */
    public function getPending() {
        $username = $_GET['username'] ?? null;
        $password = $_GET['password'] ?? null;
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => '缺少必要参数']);
            return;
        }
        
        try {
            $apiService = new JwxtApiService();
            $result = $apiService->getPendingEvaluations($username, $password);
            
            if (isset($result['error']) || (isset($result['success']) && !$result['success'])) {
                $errorMsg = $result['error'] ?? '未知错误';
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => '获取待评教列表失败: ' . $errorMsg
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'evaluations' => $result['evaluations'] ?? [],
                    'total' => $result['total'] ?? 0
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => '获取待评教列表失败: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * 一键评教所有待评课程
     */
    public function autoEvaluate() {
        $username = $_GET['username'] ?? null;
        $password = $_GET['password'] ?? null;
        $choice = isset($_GET['choice']) ? intval($_GET['choice']) : 0;
        $comment = $_GET['comment'] ?? '无';
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => '缺少必要参数']);
            return;
        }
        
        try {
            $apiService = new JwxtApiService();
            $result = $apiService->autoEvaluateAll($username, $password, $choice, $comment);
            
            if (isset($result['error']) || (isset($result['success']) && !$result['success'])) {
                $errorMsg = $result['error'] ?? '未知错误';
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => '一键评教失败: ' . $errorMsg
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'total' => $result['total'] ?? 0,
                    'succeeded' => $result['succeeded'] ?? 0,
                    'failed' => $result['failed'] ?? 0,
                    'details' => $result['details'] ?? [],
                    'message' => $result['message'] ?? '评教完成'
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => '一键评教失败: ' . $e->getMessage()
            ]);
        }
    }
}
