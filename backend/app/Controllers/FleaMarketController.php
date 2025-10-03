<?php
// 跳蚤市场控制器

require_once dirname(__DIR__) . '/Models/FleaMarket.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class FleaMarketController {
    /**
     * 获取商品列表
     */
    public function getList() {
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        // 获取状态参数（默认只显示已审核通过的商品）
        $status = $_GET['status'] ?? 'approved';
        
        try {
            // 获取商品列表
            $items = FleaMarket::getList($status, $limit, $offset);
            $total = FleaMarket::getCount($status);
            
            // 记录日志
            SystemLog::log(null, 'flea_market_list_viewed', "查看跳蚤市场列表，页码: $page, 状态: $status");
            
            // 返回结果
            echo json_encode([
                'message' => '获取商品列表成功',
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
            echo json_encode(['error' => '获取商品列表失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'flea_market_list_error', '获取商品列表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取商品详情
     */
    public function getDetail() {
        // 获取商品ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少商品ID参数']);
            return;
        }
        
        try {
            // 获取商品详情
            $item = FleaMarket::getById($id);
            
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '商品不存在']);
                return;
            }
            
            // 只允许查看已审核通过的商品，除非是管理员或发布者
            if ($item['status'] !== 'approved') {
                // 这里简化处理，实际应验证用户身份
                http_response_code(403);
                echo json_encode(['error' => '商品未审核通过']);
                return;
            }
            
            // 记录日志
            SystemLog::log(null, 'flea_market_item_viewed', "查看商品详情，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '获取商品详情成功',
                'data' => $item
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取商品详情失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'flea_market_detail_error', '获取商品详情失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 发布商品
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
        $requiredFields = ['title', 'description', 'price', 'publisher_uid'];
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
            
            // 创建商品（默认状态为待审核）
            $itemId = FleaMarket::create([
                'title' => $input['title'],
                'description' => $input['description'],
                'price' => $input['price'],
                'image_url' => $input['image_url'] ?? '',
                'publisher_uid' => $input['publisher_uid']
            ]);
            
            // 记录日志
            SystemLog::log($input['publisher_uid'], 'flea_market_item_created', "发布商品，ID: $itemId");
            
            // 返回结果
            echo json_encode([
                'message' => '商品发布成功，等待审核',
                'item_id' => $itemId
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '发布商品失败: ' . $e->getMessage()]);
            SystemLog::log($input['publisher_uid'] ?? null, 'flea_market_create_error', '发布商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 更新商品（仅限发布者）
     */
    public function update() {
        // 获取商品ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少商品ID参数']);
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
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '商品不存在']);
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
                echo json_encode(['error' => '只能修改自己发布的商品']);
                return;
            }
            
            // 已审核通过的商品不能修改
            if ($item['status'] === 'approved') {
                http_response_code(403);
                echo json_encode(['error' => '已审核通过的商品不能修改']);
                return;
            }
            
            // 更新商品
            FleaMarket::update($id, [
                'title' => $input['title'] ?? $item['title'],
                'description' => $input['description'] ?? $item['description'],
                'price' => $input['price'] ?? $item['price'],
                'image_url' => $input['image_url'] ?? $item['image_url']
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'flea_market_item_updated', "更新商品，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '商品更新成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新商品失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'flea_market_update_error', '更新商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 删除商品（仅限发布者或管理员）
     */
    public function delete() {
        // 获取商品ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少商品ID参数']);
            return;
        }
        
        try {
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '商品不存在']);
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
                echo json_encode(['error' => '只能删除自己发布的商品或需要管理员权限']);
                return;
            }
            
            // 删除商品
            FleaMarket::delete($id);
            
            // 记录日志
            SystemLog::log($userId, 'flea_market_item_deleted', "删除商品，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '商品删除成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '删除商品失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'flea_market_delete_error', '删除商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 审核商品（后台管理接口）
     */
    public function review() {
        // 获取商品ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少商品ID参数']);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证状态参数
        $status = $input['status'] ?? null;
        if (!in_array($status, ['approved', 'rejected'])) {
            http_response_code(400);
            echo json_encode(['error' => '状态参数无效，只能是approved或rejected']);
            return;
        }
        
        try {
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => '商品不存在']);
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
                echo json_encode(['error' => '只有管理员可以审核商品']);
                return;
            }
            
            // 更新商品状态
            FleaMarket::updateStatus($id, $status);
            
            // 记录日志
            SystemLog::log($userId, 'flea_market_item_reviewed', "审核商品，ID: $id, 状态: $status");
            
            // 返回结果
            echo json_encode([
                'message' => '商品审核成功',
                'status' => $status
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '审核商品失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'flea_market_review_error', '审核商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取待审核商品列表（后台管理接口）
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
            // 获取待审核商品列表
            $items = FleaMarket::getPendingList($limit, $offset);
            $total = FleaMarket::getCount('pending');
            
            // 记录日志
            SystemLog::log($userId, 'flea_market_pending_list_viewed', "查看待审核商品列表，页码: $page");
            
            // 返回结果
            echo json_encode([
                'message' => '获取待审核商品列表成功',
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
            echo json_encode(['error' => '获取待审核商品列表失败: ' . $e->getMessage()]);
            SystemLog::log($userId, 'flea_market_pending_list_error', '获取待审核商品列表失败: ' . $e->getMessage());
        }
    }
}