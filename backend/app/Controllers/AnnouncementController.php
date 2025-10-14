<?php
// 公告控制器

require_once dirname(__DIR__) . '/Models/Announcement.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class AnnouncementController {
    /**
     * 安全输出JSON响应
     * 设置正确的Content-Type头,防止XSS
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    /**
     * 将URL转换为本地文件路径
     */
    private function urlToLocalPath($url) {
        if (!$url) return null;
        $path = parse_url($url, PHP_URL_PATH);
        if (!$path) return null;
        if (strpos($path, '/uploads/') !== 0) return null; // 仅允许删除上传目录
        return ROOT_PATH . '/public' . $path;
    }

    /**
     * 安全删除文件(根据URL列表)
     * 验证路径防止路径遍历攻击
     */
    private function deleteFilesByUrls($urls) {
        if (!is_array($urls)) $urls = [$urls];
        
        $uploadsDir = realpath(ROOT_PATH . '/public/uploads');
        if (!$uploadsDir) {
            error_log("[AnnouncementController] Uploads directory not found");
            return;
        }
        
        foreach ($urls as $u) {
            $p = $this->urlToLocalPath($u);
            if (!$p || !file_exists($p)) continue;
            
            // 获取规范化路径并验证
            $realPath = realpath($p);
            if (!$realPath) continue;
            
            // 确保文件在上传目录内
            if (strpos($realPath, $uploadsDir) !== 0) {
                error_log("[AnnouncementController] Blocked attempt to delete file outside uploads: $realPath");
                continue;
            }
            
            // 安全删除
            if (@unlink($realPath)) {
                error_log("[AnnouncementController] Deleted file: $realPath");
            }
        }
    }
    
    /**
     * 获取公告列表
     */
    public function getList() {
        // 获取分页参数
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        try {
            // 获取公告列表
            $announcements = Announcement::getList($limit, $offset);
            $total = Announcement::getCount();
            
            // 返回结果
            $this->jsonResponse([
                'message' => '获取公告列表成功',
                'data' => $announcements,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取公告列表失败: ' . $e->getMessage()], 500);
            SystemLog::log(null, 'announcement_list_error', '获取公告列表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取公告详情
     */
    public function getDetail() {
        // 获取公告ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少公告ID参数'], 400);
            return;
        }
        
        try {
            // 获取公告详情
            $announcement = Announcement::getById($id);
            
            if (!$announcement) {
                $this->jsonResponse(['error' => '公告不存在'], 404);
                return;
            }
            
            // 返回结果
            $this->jsonResponse([
                'message' => '获取公告详情成功',
                'data' => $announcement
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '获取公告详情失败: ' . $e->getMessage()], 500);
            SystemLog::log(null, 'announcement_detail_error', '获取公告详情失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 创建公告（后台管理接口）
     */
    public function create() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['title', 'content'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->jsonResponse(['error' => "缺少必填字段: $field"], 400);
                return;
            }
        }
        
        try {
            // 验证管理员权限
            $user = User::findById($adminUserId);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            if ($user['role'] !== 'admin') {
                $this->jsonResponse(['error' => '只有管理员可以发布公告'], 403);
                return;
            }
            
            // 创建公告，使用 session 中的用户ID
            $announcementData = [
                'title' => $input['title'],
                'content' => $input['content'],
                'author_uid' => $adminUserId  // 使用 session 中的 user_id，而非前端传递的值
            ];
            
            // 如果有图片，添加图片字段
            if (isset($input['images']) && is_array($input['images'])) {
                $announcementData['images'] = json_encode($input['images']);
            }
            
            $announcementId = Announcement::create($announcementData);
            
            // 记录日志
            SystemLog::log($adminUserId, 'announcement_created', "创建公告，ID: $announcementId");
            
            // 返回结果
            $this->jsonResponse([
                'message' => '公告发布成功',
                'announcement_id' => $announcementId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '发布公告失败: ' . $e->getMessage()], 500);
            SystemLog::log($adminUserId ?? null, 'announcement_create_error', '发布公告失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 更新公告（后台管理接口）
     */
    public function update() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        // 获取公告ID（兼容 GET 和 POST）
        $id = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少公告ID参数'], 400);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['title', 'content'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->jsonResponse(['error' => "缺少必填字段: $field"], 400);
                return;
            }
        }
        
        try {
            // 检查公告是否存在
            $announcement = Announcement::getById($id);
            if (!$announcement) {
                $this->jsonResponse(['error' => '公告不存在'], 404);
                return;
            }
            
            // 验证管理员权限
            $user = User::findById($adminUserId);
            if (!$user || $user['role'] !== 'admin') {
                $this->jsonResponse(['error' => '只有管理员可以修改公告'], 403);
                return;
            }
            
            // 更新公告
            $updateData = [
                'title' => $input['title'],
                'content' => $input['content']
            ];
            
            // 如果有状态，更新状态
            if (isset($input['status'])) {
                $updateData['status'] = $input['status'];
            }
            
            // 如果有图片，更新图片字段
            if (isset($input['images']) && is_array($input['images'])) {
                $updateData['images'] = json_encode($input['images']);
            }
            
            Announcement::update($id, $updateData);
            
            // 记录日志
            SystemLog::log($adminUserId, 'announcement_updated', "更新公告，ID: $id，标题: {$input['title']}");
            
            // 返回结果
            $this->jsonResponse([
                'success' => true,
                'message' => '公告更新成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '更新公告失败: ' . $e->getMessage()], 500);
            SystemLog::log($adminUserId ?? null, 'announcement_update_error', '更新公告失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 删除公告（后台管理接口）
     */
    public function delete() {
        // 验证管理员登录状态
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_user_id'])) {
            $this->jsonResponse(['error' => '未登录或会话已过期'], 401);
            return;
        }
        
        $adminUserId = $_SESSION['admin_user_id'];
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 兼容 GET 和 POST 两种方式
        $id = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => '缺少公告ID参数'], 400);
            return;
        }
        
        try {
            // 检查公告是否存在
            $announcement = Announcement::getById($id);
            if (!$announcement) {
                $this->jsonResponse(['error' => '公告不存在'], 404);
                return;
            }
            
            // 保存标题用于日志记录
            $announcementTitle = $announcement['title'] ?? '未知';
            
            // 验证管理员权限
            $user = User::findById($adminUserId);
            if (!$user || $user['role'] !== 'admin') {
                $this->jsonResponse(['error' => '只有管理员可以删除公告'], 403);
                return;
            }
            
            // 删除公告前先删除关联的图片
            if (!empty($announcement['images'])) {
                $imageUrls = json_decode($announcement['images'], true);
                if (is_array($imageUrls) && !empty($imageUrls)) {
                    $this->deleteFilesByUrls($imageUrls);
                }
            }
            
            // 删除公告
            Announcement::delete($id);
            
            // 记录日志
            SystemLog::log($adminUserId, 'announcement_deleted', "删除公告，ID: $id，标题: $announcementTitle");
            
            // 返回结果
            $this->jsonResponse([
                'success' => true,
                'message' => '公告删除成功'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => '删除公告失败: ' . $e->getMessage()], 500);
            SystemLog::log($adminUserId ?? null, 'announcement_delete_error', '删除公告失败: ' . $e->getMessage());
        }
    }
}