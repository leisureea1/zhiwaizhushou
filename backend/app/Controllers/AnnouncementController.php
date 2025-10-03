<?php
// 公告控制器

require_once dirname(__DIR__) . '/Models/Announcement.php';
require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class AnnouncementController {
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
            
            // 记录日志
            SystemLog::log(null, 'announcement_list_viewed', "查看公告列表，页码: $page");
            
            // 返回结果
            echo json_encode([
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
            http_response_code(500);
            echo json_encode(['error' => '获取公告列表失败: ' . $e->getMessage()]);
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
            http_response_code(400);
            echo json_encode(['error' => '缺少公告ID参数']);
            return;
        }
        
        try {
            // 获取公告详情
            $announcement = Announcement::getById($id);
            
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => '公告不存在']);
                return;
            }
            
            // 记录日志
            SystemLog::log(null, 'announcement_viewed', "查看公告详情，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '获取公告详情成功',
                'data' => $announcement
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取公告详情失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'announcement_detail_error', '获取公告详情失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 创建公告（后台管理接口）
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
        $requiredFields = ['title', 'content', 'author_uid'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "缺少必填字段: $field"]);
                return;
            }
        }
        
        try {
            // 验证用户是否存在且有权限
            $user = User::findById($input['author_uid']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            if ($user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => '只有管理员可以发布公告']);
                return;
            }
            
            // 创建公告
            $announcementId = Announcement::create([
                'title' => $input['title'],
                'content' => $input['content'],
                'author_uid' => $input['author_uid']
            ]);
            
            // 记录日志
            SystemLog::log($input['author_uid'], 'announcement_created', "创建公告，ID: $announcementId");
            
            // 返回结果
            echo json_encode([
                'message' => '公告发布成功',
                'announcement_id' => $announcementId
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '发布公告失败: ' . $e->getMessage()]);
            SystemLog::log($input['author_uid'] ?? null, 'announcement_create_error', '发布公告失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 更新公告（后台管理接口）
     */
    public function update() {
        // 获取公告ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少公告ID参数']);
            return;
        }
        
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['title', 'content'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "缺少必填字段: $field"]);
                return;
            }
        }
        
        try {
            // 检查公告是否存在
            $announcement = Announcement::getById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => '公告不存在']);
                return;
            }
            
            // 验证用户是否有权限
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
                echo json_encode(['error' => '只有管理员可以修改公告']);
                return;
            }
            
            // 更新公告
            Announcement::update($id, [
                'title' => $input['title'],
                'content' => $input['content']
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'announcement_updated', "更新公告，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '公告更新成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新公告失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'announcement_update_error', '更新公告失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 删除公告（后台管理接口）
     */
    public function delete() {
        // 获取公告ID
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => '缺少公告ID参数']);
            return;
        }
        
        try {
            // 检查公告是否存在
            $announcement = Announcement::getById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => '公告不存在']);
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
            
            if ($user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => '只有管理员可以删除公告']);
                return;
            }
            
            // 删除公告
            Announcement::delete($id);
            
            // 记录日志
            SystemLog::log($userId, 'announcement_deleted', "删除公告，ID: $id");
            
            // 返回结果
            echo json_encode([
                'message' => '公告删除成功'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '删除公告失败: ' . $e->getMessage()]);
            SystemLog::log($userId ?? null, 'announcement_delete_error', '删除公告失败: ' . $e->getMessage());
        }
    }
}