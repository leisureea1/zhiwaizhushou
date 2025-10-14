<?php
// 跳蚤市场控制器

require_once dirname(__DIR__) . '/Models/FleaMarket.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class FleaMarketController {
    // 统一JSON响应
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function urlToLocalPath($url) {
        if (!$url) return null;
        $path = parse_url($url, PHP_URL_PATH);
        if (!$path) return null;
        if (strpos($path, '/uploads/') !== 0) return null; // 仅允许删除上传目录
        return ROOT_PATH . '/public' . $path;
    }

    private function deleteFilesByUrls($urls) {
        if (!is_array($urls)) $urls = [$urls];
        $uploadsDir = realpath(ROOT_PATH . '/public/uploads');
        if (!$uploadsDir) {
            error_log('[FleaMarketController] Uploads directory not found');
            return;
        }
        foreach ($urls as $u) {
            $p = $this->urlToLocalPath($u);
            if (!$p || !file_exists($p)) continue;
            $realPath = realpath($p);
            if (!$realPath) continue;
            if (strpos($realPath, $uploadsDir) !== 0) {
                error_log('[FleaMarketController] Blocked deletion outside uploads: ' . $realPath);
                continue;
            }
            // 已严格校验路径位于 uploads 目录，安全删除
            @unlink($realPath); // safe: validated path within uploads dir
        }
    }
    /**
     * 获取商品列表
     */
    public function getList() {
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        // 获取状态和分类参数
        $status = $_GET['status'] ?? 'approved';
        $category = $_GET['category'] ?? null;
        $publisherUid = isset($_GET['publisher_uid']) ? intval($_GET['publisher_uid']) : null;
        
        try {
            // 获取商品列表
            $q = $_GET['q'] ?? null;
            $items = FleaMarket::getList($status, $limit, $offset, $category, $publisherUid, $q);
            // 绝对化URL
            foreach ($items as &$it) {
                if (!function_exists('abs_url')) { function abs_url($p){ return $p; } }
                if (!empty($it['image_url'])) $it['image_url'] = abs_url($it['image_url']);
                if (!empty($it['image_urls'])) {
                    $arr = json_decode($it['image_urls'], true);
                    if (is_array($arr)) $it['image_urls'] = array_map('abs_url', $arr);
                }
                if (!empty($it['wechat_qr_url'])) $it['wechat_qr_url'] = abs_url($it['wechat_qr_url']);
            }
            $total = FleaMarket::getCount($status);
            
            // 返回结果
            $this->jsonResponse([
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
            $this->jsonResponse(['error' => '获取商品列表失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少商品ID参数'], 400);
            return;
        }
        
        try {
            // 获取商品详情
            $item = FleaMarket::getById($id);
            if ($item) {
                if (!function_exists('abs_url')) { function abs_url($p){ return $p; } }
                if (!empty($item['image_url'])) $item['image_url'] = abs_url($item['image_url']);
                if (!empty($item['image_urls'])) {
                    $arr = json_decode($item['image_urls'], true);
                    if (is_array($arr)) $item['image_urls'] = array_map('abs_url', $arr);
                }
                if (!empty($item['wechat_qr_url'])) $item['wechat_qr_url'] = abs_url($item['wechat_qr_url']);
            }
            
            if (!$item) {
                $this->jsonResponse(['error' => '商品不存在'], 404);
                return;
            }
            
            // 只允许查看已审核通过的商品，除非是管理员或发布者
            if ($item['status'] !== 'approved') {
                $userId = $_GET['user_id'] ?? null;
                $allow = false;
                if ($userId) {
                    if ($item['publisher_uid'] == $userId) {
                        $allow = true;
                    } else {
                        $user = User::findById($userId);
                        if ($user && ($user['role'] ?? '') === 'admin') { $allow = true; }
                    }
                }
                if (!$allow) {
                    $this->jsonResponse(['error' => '商品未审核通过'], 403);
                    return;
                }
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '获取商品详情成功',
                'data' => $item
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取商品详情失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['title', 'description', 'price', 'publisher_uid'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->jsonResponse(['error' => "缺少必填字段: $field"], 400);
                return;
            }
        }
        
        try {
            // 验证用户是否存在
            $user = User::findById($input['publisher_uid']);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            // 创建商品（默认状态为待审核）
            $itemId = FleaMarket::create([
                'title' => $input['title'],
                'description' => $input['description'],
                'price' => $input['price'],
                'category' => $input['category'] ?? null,
                'condition' => $input['condition'] ?? null,
                'image_url' => $input['image_url'] ?? '',
                'image_urls' => $input['image_urls'] ?? null,
                'location' => $input['location'] ?? null,
                'contact_info' => $input['contact_info'] ?? '',
                'wechat_qr_url' => $input['wechat_qr_url'] ?? '',
                'publisher_uid' => $input['publisher_uid']
            ]);
            
            // 记录日志
            SystemLog::log($input['publisher_uid'], 'flea_market_item_created', '发布商品，ID: ' . $itemId);
            
            // 发送 Bark 通知给管理员
            try {
                require_once dirname(__DIR__) . '/Services/NotificationService.php';
                $user = User::findById($input['publisher_uid']);
                $publisherName = $user['name'] ?? '未知用户';
                NotificationService::notifyFleaMarketItemCreated($itemId, $input['title'], $publisherName);
            } catch (Exception $notifyError) {
                // 通知失败不影响主流程
                error_log('[FleaMarket] Failed to send notification: ' . $notifyError->getMessage());
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '商品发布成功，等待审核',
                'item_id' => $itemId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '发布商品失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少商品ID参数'], 400);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        try {
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '商品不存在'], 404);
                return;
            }
            
            // 验证用户是否有权限（仅发布者可以修改）
            $userId = $input['user_id'] ?? null;
            if (!$userId) {
                $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
                return;
            }
            
            if ($item['publisher_uid'] != $userId) {
                $this->jsonResponse(['error' => '只能修改自己发布的商品'], 403);
                return;
            }
            
            // 允许修改已审核商品：修改后重置为待审核
            
            // 更新商品（若传入了新的图片，删除被替换的旧图片）
            $oldUrls = [];
            if (!empty($item['image_url'])) $oldUrls[] = $item['image_url'];
            if (!empty($item['image_urls'])) {
                $arr = json_decode($item['image_urls'], true);
                if (is_array($arr)) $oldUrls = array_merge($oldUrls, $arr);
            }
            if (!empty($item['wechat_qr_url'])) $oldUrls[] = $item['wechat_qr_url'];

            $newUrls = $oldUrls; // 默认不变
            $willReplace = false;
            if (array_key_exists('image_url', $input)) { $willReplace = true; }
            if (array_key_exists('image_urls', $input)) { $willReplace = true; }
            if (array_key_exists('wechat_qr_url', $input)) { $willReplace = true; }

            if ($willReplace) {
                $newUrls = [];
                if (!empty($input['image_url'])) $newUrls[] = $input['image_url'];
                if (!empty($input['image_urls'])) {
                    $tmp = is_array($input['image_urls']) ? $input['image_urls'] : json_decode($input['image_urls'], true);
                    if (is_array($tmp)) $newUrls = array_merge($newUrls, $tmp);
                }
                if (!empty($input['wechat_qr_url'])) $newUrls[] = $input['wechat_qr_url'];
                // 删除被替换的旧文件
                $toDelete = array_diff($oldUrls, $newUrls);
                if (!empty($toDelete)) $this->deleteFilesByUrls(array_values($toDelete));
            }

            // 更新商品
            FleaMarket::update($id, [
                'title' => $input['title'] ?? $item['title'],
                'description' => $input['description'] ?? $item['description'],
                'price' => $input['price'] ?? $item['price'],
                'category' => $input['category'] ?? $item['category'] ?? null,
                'condition' => $input['condition'] ?? ($item['condition_level'] ?? null),
                'image_url' => $input['image_url'] ?? $item['image_url'],
                'image_urls' => $input['image_urls'] ?? (isset($item['image_urls']) ? json_decode($item['image_urls'], true) : null),
                'location' => $input['location'] ?? $item['location'] ?? null,
                'contact_info' => $input['contact_info'] ?? $item['contact_info'],
                'wechat_qr_url' => $input['wechat_qr_url'] ?? $item['wechat_qr_url']
            ]);

            // 重置状态为待审核
            FleaMarket::updateStatus($id, 'pending');
            
            // 记录日志
            SystemLog::log($userId, 'flea_market_item_updated', "更新商品，ID: $id");
            
            // 返回结果
            $this->jsonResponse([
                'message' => '商品更新成功，已提交重新审核'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '更新商品失败: ' . $e->getMessage()], 500);
            SystemLog::log($userId ?? null, 'flea_market_update_error', '更新商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 删除商品（仅限发布者或管理员）
     */
    public function delete() {
        // 获取请求数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 获取商品ID (支持从body或query获取)
        $id = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少商品ID参数'], 400);
            return;
        }
        
        // 获取用户ID (支持从body或query获取)
        $userId = $input['user_id'] ?? $_GET['user_id'] ?? null;
        
        // 检查是否为管理员会话
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $isAdmin = isset($_SESSION['admin_user_id']);
        $adminUserId = $_SESSION['admin_user_id'] ?? null;
        
        // 至少需要user_id或admin会话
        if (!$userId && !$isAdmin) {
            $this->jsonResponse(['error' => '缺少用户ID参数或未登录'], 400);
            return;
        }
        
        try {
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '商品不存在'], 404);
                return;
            }
            
            // 验证权限：必须是发布者本人或管理员
            if (!$isAdmin && $item['publisher_uid'] != $userId) {
                $this->jsonResponse(['error' => '无权删除该商品'], 403);
                return;
            }
            
            // 删除商品前删除已上传图片
            $oldUrls = [];
            if (!empty($item['image_url'])) $oldUrls[] = $item['image_url'];
            if (!empty($item['image_urls'])) {
                $arr = json_decode($item['image_urls'], true);
                if (is_array($arr)) $oldUrls = array_merge($oldUrls, $arr);
            }
            if (!empty($item['wechat_qr_url'])) $oldUrls[] = $item['wechat_qr_url'];
            if (!empty($oldUrls)) $this->deleteFilesByUrls($oldUrls);

            // 删除商品
            FleaMarket::delete($id);
            
            // 记录日志
            $logUserId = $isAdmin ? $adminUserId : $userId;
            $logMsg = $isAdmin ? "管理员删除商品，ID: $id" : "用户删除商品，ID: $id";
            SystemLog::log($logUserId, 'flea_market_item_deleted', $logMsg);
            
            // 返回结果
            $this->jsonResponse([
                'message' => '商品删除成功'
            ]);
        } catch (Exception $e) {
            
            $logUserId = $isAdmin ? $adminUserId : $userId;
            $this->jsonResponse(['error' => '删除商品失败: ' . $e->getMessage()], 500);
            SystemLog::log($logUserId, 'flea_market_delete_error', '删除商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 审核商品（后台管理接口）
     */
    public function review() {
        // 清理输出缓冲区,避免警告信息混入JSON响应
        if (ob_get_level()) {
            ob_clean();
        }
        
        // 预先定义变量,避免作用域警告
        $itemId = null;
        $adminUserId = null;
        
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取商品ID
        $id = $_GET['id'] ?? null;
        $itemId = $id;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少商品ID参数'], 400);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        // 验证状态参数
        $status = $input['status'] ?? null;
        if (!in_array($status, ['approved', 'rejected'])) {
            $this->jsonResponse(['error' => '状态参数无效，只能是approved或rejected'], 400);
            return;
        }
        
        try {
            // 检查商品是否存在
            $item = FleaMarket::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '商品不存在'], 404);
                return;
            }
            
            // 更新商品状态
            FleaMarket::updateStatus($itemId, $status);
            
            // 记录日志
            SystemLog::log($adminUserId, 'flea_market_item_reviewed', '审核商品，ID: ' . $itemId . ', 状态: ' . $status);
            // 向发布者发送通知日志（用于小程序消息列表）
            $publisherUid = $item['publisher_uid'] ?? null;
            if ($publisherUid) {
                $msgDesc = $status === 'approved' ? '您的商品已审核通过' : '您的商品审核未通过';
                $reason = $input['reason'] ?? '';
                if ($status === 'rejected' && $reason) {
                    $msgDesc .= "，原因：$reason";
                }
                SystemLog::log($publisherUid, 'flea_market_review_notify', $msgDesc . '（ID: ' . $itemId . '）');
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '商品审核成功',
                'status' => $status
            ]);
        } catch (Exception $e) {
            // 清理可能的错误输出
            if (ob_get_level()) {
                ob_clean();
            }
            $this->jsonResponse(['error' => '审核商品失败: ' . $e->getMessage()], 500);
            SystemLog::log($adminUserId ?? null, 'flea_market_review_error', '审核商品失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取待审核商品列表（后台管理接口）
     */
    public function getPendingList() {
        // 验证用户权限（这里简化处理，实际应验证管理员身份）
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
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
            
            // 返回结果
            $this->jsonResponse([
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
            $this->jsonResponse(['error' => '获取待审核商品列表失败: ' . $e->getMessage()], 500);
            SystemLog::log($userId, 'flea_market_pending_list_error', '获取待审核商品列表失败: ' . $e->getMessage());
        }
    }
}