<?php
// 失物招领控制器

require_once dirname(__DIR__) . '/Models/LostFound.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';
require_once dirname(__DIR__) . '/Utils/FileHelper.php';

class LostFoundController {
    /**
     * 统一 JSON 响应（设置 Content-Type 并可选状态码）
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 将URL转换为本地文件路径
     */
    private function urlToLocalPath($url) {
        if (!$url) return null;
        $path = parse_url($url, PHP_URL_PATH);
        if (!$path) return null;
        // 仅允许删除 public/uploads 目录下的文件（通过 realpath 进行规范化与前缀校验）
        $fullPath = realpath(ROOT_PATH . '/public' . $path);
        $uploadsRoot = realpath(ROOT_PATH . '/public/uploads');
        if ($fullPath && $uploadsRoot && strpos($fullPath, $uploadsRoot) === 0) {
            return $fullPath;
        }
        return null;
    }

    /**
     * 删除文件(根据URL列表)
     */
    private function deleteFilesByUrls($urls) {
        if (!is_array($urls)) $urls = [$urls];
        $uploadsDir = realpath(ROOT_PATH . '/public/uploads');
        if (!$uploadsDir) {
            error_log('[LostFoundController] Uploads directory not found');
            return;
        }
        foreach ($urls as $u) {
            $p = $this->urlToLocalPath($u);
            if (!$p || !file_exists($p)) continue;
            $realPath = realpath($p);
            if (!$realPath) continue;
            if (strpos($realPath, $uploadsDir) !== 0) {
                error_log('[LostFoundController] Blocked deletion outside uploads: ' . $realPath);
                continue;
            }
            // 已严格校验路径位于 uploads 目录，安全删除
            FileHelper::safeUnlinkWithinUploads($realPath);
            error_log("[LostFoundController] Deleted file: $realPath");
        }
    }
    
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
            // 获取列表（支持关键字与发布者筛选）
            $q = $_GET['q'] ?? null;
            $publisherUid = isset($_GET['publisher_uid']) ? intval($_GET['publisher_uid']) : null;
            $category = $_GET['category'] ?? null;
            $items = LostFound::getList($status, $limit, $offset, $q, $publisherUid, $category);
            foreach ($items as &$it) {
                if (!function_exists('abs_url')) { function abs_url($p){ return $p; } }
                if (!empty($it['image_url'])) $it['image_url'] = abs_url($it['image_url']);
                if (!empty($it['image_urls'])) {
                    $arr = json_decode($it['image_urls'], true);
                    if (is_array($arr)) $it['image_urls'] = array_map('abs_url', $arr);
                }
                if (!empty($it['wechat_qr_url'])) $it['wechat_qr_url'] = abs_url($it['wechat_qr_url']);
            }
            $total = LostFound::getCount($status);
            
            // 返回结果
            $this->jsonResponse([
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
            $this->jsonResponse(['error' => '获取失物招领列表失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少ID参数'], 400);
            return;
        }
        
        try {
            // 获取详情
            $item = LostFound::getById($id);
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
                $this->jsonResponse(['error' => '信息不存在'], 404);
                return;
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '获取详情成功',
                'data' => $item
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取详情失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['description', 'publisher_uid'];
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
            
            // 创建信息
            $itemId = LostFound::create([
                'description' => $input['description'],
                'image_url' => $input['image_url'] ?? '',
                'image_urls' => $input['image_urls'] ?? null,
                'category' => $input['category'] ?? null,
                'location' => $input['location'] ?? null,
                'status' => $input['status'] ?? 'lost',
                'publisher_uid' => $input['publisher_uid'],
                'contact_info' => $input['contact_info'] ?? '',
                'wechat_qr_url' => $input['wechat_qr_url'] ?? '',
                'lost_time' => $input['lost_time'] ?? ($input['time'] ?? null)
            ]);
            
            // 记录日志
            SystemLog::log($input['publisher_uid'], 'lost_found_item_created', "发布失物招领信息，ID: $itemId");
            
            // 发送 Bark 通知给管理员
            try {
                require_once dirname(__DIR__) . '/Services/NotificationService.php';
                $user = User::findById($input['publisher_uid']);
                $publisherName = $user['name'] ?? '未知用户';
                $type = $input['type'] ?? ($input['status'] ?? 'lost');
                // 失物招领使用 description 而不是 title
                $description = $input['description'] ?? '无描述';
                NotificationService::notifyLostFoundItemCreated($itemId, $description, $publisherName, $type);
            } catch (Exception $notifyError) {
                // 通知失败不影响主流程
                error_log('[LostFound] Failed to send notification: ' . $notifyError->getMessage());
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '信息发布成功',
                'item_id' => $itemId
            ], 201);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '发布信息失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少ID参数'], 400);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '信息不存在'], 404);
                return;
            }
            
            // 验证用户是否有权限（仅发布者可以修改）
            $userId = $input['user_id'] ?? null;
            if (!$userId) {
                $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
                return;
            }
            
            if ($item['publisher_uid'] != $userId) {
                $this->jsonResponse(['error' => '只能修改自己发布的信息'], 403);
                return;
            }
            
            // 更新信息
            LostFound::update($id, [
                'description' => $input['description'] ?? $item['description'],
                'image_url' => $input['image_url'] ?? $item['image_url'],
                'image_urls' => $input['image_urls'] ?? (isset($item['image_urls']) ? json_decode($item['image_urls'], true) : null),
                'category' => $input['category'] ?? $item['category'] ?? null,
                'location' => $input['location'] ?? $item['location'] ?? null,
                'status' => $input['status'] ?? $item['status'],
                'contact_info' => $input['contact_info'] ?? $item['contact_info'],
                'wechat_qr_url' => $input['wechat_qr_url'] ?? $item['wechat_qr_url'],
                'lost_time' => $input['lost_time'] ?? $item['lost_time'] ?? null
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_item_updated', "更新失物招领信息，ID: $id");
            
            // 返回结果
            $this->jsonResponse([
                'message' => '信息更新成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '更新信息失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少ID参数'], 400);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '信息不存在'], 404);
                return;
            }
            
            // 验证用户是否有权限
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
                return;
            }
            
            $user = User::findById($userId);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            // 只有发布者或管理员可以删除
            if ($item['publisher_uid'] != $userId && $user['role'] !== 'admin') {
                $this->jsonResponse(['error' => '只能删除自己发布的信息或需要管理员权限'], 403);
                return;
            }
            
            // 删除信息前先删除关联的图片
            $oldUrls = [];
            if (!empty($item['image_url'])) $oldUrls[] = $item['image_url'];
            if (!empty($item['image_urls'])) {
                $arr = json_decode($item['image_urls'], true);
                if (is_array($arr)) $oldUrls = array_merge($oldUrls, $arr);
            }
            if (!empty($item['wechat_qr_url'])) $oldUrls[] = $item['wechat_qr_url'];
            if (!empty($oldUrls)) $this->deleteFilesByUrls($oldUrls);
            
            // 删除信息
            LostFound::delete($id);
            
            // 记录日志
            SystemLog::log($userId, 'lost_found_item_deleted', "删除失物招领信息，ID: $id");
            
            // 返回结果
            $this->jsonResponse([
                'message' => '信息删除成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '删除信息失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少ID参数'], 400);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '信息不存在'], 404);
                return;
            }
            
            // 验证用户是否有权限（仅管理员可以审核）
            $userId = $input['user_id'] ?? null;
            if (!$userId) {
                $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
                return;
            }
            
            $user = User::findById($userId);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            if ($user['role'] !== 'admin') {
                $this->jsonResponse(['error' => '只有管理员可以审核信息'], 403);
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
            $this->jsonResponse([
                'message' => '信息审核成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '审核信息失败: ' . $e->getMessage()], 500);
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
            $this->jsonResponse(['error' => '缺少用户ID参数'], 400);
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
            
            // 返回结果
            $this->jsonResponse([
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
            $this->jsonResponse(['error' => '获取待审核列表失败: ' . $e->getMessage()], 500);
            SystemLog::log($userId, 'lost_found_pending_list_error', '获取待审核列表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 管理员删除失物招领信息
     */
    public function adminDelete() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取ID参数
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少ID参数'], 400);
            return;
        }
        
        try {
            // 检查信息是否存在
            $item = LostFound::getById($id);
            if (!$item) {
                $this->jsonResponse(['error' => '信息不存在'], 404);
                return;
            }
            
            // 删除信息前先删除关联的图片
            $oldUrls = [];
            if (!empty($item['image_url'])) $oldUrls[] = $item['image_url'];
            if (!empty($item['image_urls'])) {
                $arr = json_decode($item['image_urls'], true);
                if (is_array($arr)) $oldUrls = array_merge($oldUrls, $arr);
            }
            if (!empty($item['wechat_qr_url'])) $oldUrls[] = $item['wechat_qr_url'];
            if (!empty($oldUrls)) $this->deleteFilesByUrls($oldUrls);
            
            // 删除信息
            LostFound::delete($id);
            
            // 记录日志
            SystemLog::log($adminUserId, 'lost_found_item_deleted', "删除失物招领信息，ID: $id");
            
            // 返回结果
            $this->jsonResponse([
                'message' => '删除成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '删除失败: ' . $e->getMessage()], 500);
            SystemLog::log($adminUserId, 'lost_found_delete_error', '删除失物招领信息失败: ' . $e->getMessage());
        }
    }
}