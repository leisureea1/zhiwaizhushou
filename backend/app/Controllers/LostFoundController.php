<?php
// 失物招领控制器

require_once dirname(__DIR__) . '/Models/LostFound.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class LostFoundController {
    /**
     * 获取失物招领列表
     */
    public function getList() {
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        // 获取状态参数
        $status = $_GET['status'] ?? null;
        
        try {
            // 获取列表
            $items = LostFound::getList($status, $limit, $offset);
            $total = LostFound::getCount($status);
            
            // 记录日志
            SystemLog::log(null, 'lost_found_list_viewed', "查看失物招领列表，页码: $page, 状态: " . ($status ?: '全部'));
            
            // 返回结果
            echo json_encode([
                'message' => '获取失物招领列表成功',
                'data' => $items,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取失物招领列表失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'lost_found_list_error', '获取失物招领列表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取详情
     */
    public function getDetail() {
        // 获取ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少ID参数']);
            return;
        }
        
        try {
            // 获取详情
            $item = LostFound::getById($id);
            
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '信息不存在']);
                return;
            }
            
            // 记录日志
            SystemLog::log(null, 'lost_found_item_viewed', "查看失物招领详情，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '获取详情成功',
                'data' => $item
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取详情失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'lost_found_detail_error', '获取详情失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 发布信息
     */
    public function create() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['description', 'publisher_uid'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "缺少必填字段: $field"]);
                return;
            }
        }
        
        try {
            // 验证用户是否存在
            $user = User::findById($input['publisher_uid']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 创建信息
            $itemId = LostFound::create([
                'description' => $input['description'],
                'image_url' => $input['image_url'] ?? '',
                'status' => $input['status'] ?? 'lost',
                'publisher_uid' => $input['publisher_uid'],
                'contact_info' => $input['contact_info'] ?? ''
            ]);
            
            // 记录日志
            SystemLog::log($input['publisher_uid'], 'lost_found_item_created', "发布失物招领信息，ID: $itemId");
            
            // 返回结果
            echo json_encode([
                'message' => '信息发布成功',
                'item_id' => $itemId
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '发布信息失败: ' . $e->getMessage()]);
            SystemLog::log($input['publisher_uid'] ?? null, 'lost_found_create_error', '发布信息失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 更新信息
     */
    public function update() {
        // 获取ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少ID参数']);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '信息不存在']);
                return;
            }
            
            // 验证用户是否有权限（仅发布者可以修改）
            $userId = $input['user_id'] ?? null;
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => '缺少用户ID参数']);
                return;
            }
            
            if ($item['publisher_uid'] != $userId) {
                http_response_code(403);
                echo json_encode(['error' => '只能修改自己发布的信息']);
                return;
            }
            
            // 更新信息
            LostFound::update($id, [
                'description' => $input['description'] ?? $item['description'],
                'image_url' => $input['image_url'] ?? $item['image_url'],
                'status' => $input['status'] ?? $item['status'],
                'contact_info' => $input['contact_info'] ?? $item['contact_info']
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_item_updated', "更新失物招领信息，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '信息更新成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新信息失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'lost_found_update_error', '更新信息失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 删除信息
     */
    public function delete() {
        // 获取ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少ID参数']);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '信息不存在']);
                return;
            }
            
            // 验证用户是否有权限
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => '缺少用户ID参数']);
                return;
            }
            
            $user = User::findById($userId);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 只有发布者或管理员可以删除
            if ($item['publisher_uid'] != $userId && $user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => '只能删除自己发布的信息或需要管理员权限']);
                return;
            }
            
            // 删除信息
            LostFound::delete($id);
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_item_deleted', "删除失物招领信息，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '信息删除成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '删除信息失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'lost_found_delete_error', '删除信息失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 审核信息（后台管理接口）
     */
    public function review() {
        // 获取ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少ID参数']);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '信息不存在']);
                return;
            }
            
            // 验证用户是否有权限（仅管理员可以审核）
            $userId = $input['user_id'] ?? null;
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => '缺少用户ID参数']);
                return;
            }
            
            $user = User::findById($userId);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            if ($user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => '只有管理员可以审核信息']);
                return;
            }
            
            // 更新信息状态
            LostFound::update($id, [
                'status' => $input['status'] ?? $item['status'],
                'description' => $input['description'] ?? $item['description'],
                'image_url' => $input['image_url'] ?? $item['image_url'],
                'contact_info' => $input['contact_info'] ?? $item['contact_info']
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_item_reviewed', "审核失物招领信息，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '信息审核成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '审核信息失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'lost_found_review_error', '审核信息失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取待审核列表（后台管理接口）
     */
    public function getPendingList() {
        // 验证用户权限（这里简化处理，实际应验证管理员身份）
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => '缺少用户ID参数']);
            return;
        }
        
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        try {
            // 获取待审核列表
            $items = LostFound::getPendingList($limit, $offset);
            $total = LostFound::getCount();
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_pending_list_viewed', "查看待审核失物招领列表，页码: $page");
            
            // 返回结果
            echo json_encode([
                'message' => '获取待审核列表成功',
                'data' => $items,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取待审核列表失败: ' . $e->getMessage()]);
            SystemLog::log($userId, 'lost_found_pending_list_error', '获取待审核列表失败: ' . $e->getMessage());
        }
    }
}