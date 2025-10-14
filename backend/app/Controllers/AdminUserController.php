<?php
// 管理员-用户管理控制器

require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class AdminUserController {
    
    /**
     * 安全输出JSON响应
     * 设置正确的Content-Type头,防止XSS
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    // 列表
    public function list() {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        try {
            $rows = User::getAllUsers($limit, $offset);
            // 简化：总数用当前页数量（如需精准总数，可添加 User::getCount）
            $this->jsonResponse([
                'success' => true,
                'data' => $rows,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => count($rows)
                ]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // 创建
    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        $studentId = trim($input['student_id'] ?? '');
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $role = $input['role'] ?? 'user';
        if ($role === 'student') { $role = 'user'; }
        if ($studentId === '' || $name === '' || $email === '') {
            $this->jsonResponse(['error' => '学号、姓名、邮箱为必填'], 400);
            return;
        }
        try {
            if (User::findByStudentId($studentId)) {
                $this->jsonResponse(['error' => '该学号已存在'], 409);
                return;
            }
            if (User::findByEmail($email)) {
                $this->jsonResponse(['error' => '该邮箱已存在'], 409);
                return;
            }
            // 生成临时密码
            $tempPassword = bin2hex(random_bytes(4)); // 8位十六进制
            $uid = User::create([
                'student_id' => $studentId,
                'name' => $name,
                'password_hash' => password_hash($tempPassword, PASSWORD_DEFAULT),
                'avatar_url' => null,
                'edu_system_username' => $studentId,
                'edu_system_password' => null,
                'email' => $email
            ]);
            User::updateRole($uid, $role);
            SystemLog::log($uid, 'admin_user_created', '管理员创建用户');
            $this->jsonResponse(['success' => true, 'user_id' => $uid, 'temp_password' => $tempPassword]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // 更新角色
    public function updateRole() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        $uid = intval($input['user_id'] ?? 0);
        $role = $input['role'] ?? '';
        if ($uid <= 0 || ($role !== 'admin' && $role !== 'user')) {
            $this->jsonResponse(['error' => '参数错误'], 400);
            return;
        }
        try {
            User::updateRole($uid, $role);
            SystemLog::log($uid, 'admin_user_role_updated', '管理员更新用户角色为: ' . $role);
            $this->jsonResponse(['success' => true]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // 删除
    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        $uid = intval($input['user_id'] ?? 0);
        if ($uid <= 0) {
            $this->jsonResponse(['error' => '参数错误'], 400);
            return;
        }
        
        // 获取当前登录的管理员 ID
        $currentAdminId = $this->getCurrentAdminId();
        
        // 检查是否尝试删除自己
        if ($currentAdminId && $uid === $currentAdminId) {
            $this->jsonResponse(['error' => '不能删除自己的账号'], 403);
            return;
        }
        
        try {
            User::deleteById($uid);
            SystemLog::log($currentAdminId ?? $uid, 'admin_user_deleted', '管理员删除用户 UID: ' . $uid);
            $this->jsonResponse(['success' => true]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    // 获取用户详情（包含教务系统密码）
    public function detail() {
        $uid = intval($_GET['user_id'] ?? 0);
        if ($uid <= 0) {
            $this->jsonResponse(['error' => '参数错误'], 400);
            return;
        }
        
        try {
            $user = User::findById($uid);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            // 返回完整的用户信息（包含教务系统密码）
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'id' => (string)$user['uid'],
                    'username' => $user['username'],
                    'name' => $user['name'],
                    'studentId' => $user['edu_system_username'],
                    'eduPassword' => $user['edu_system_password'] ?? '',
                    'avatarUrl' => $user['avatar_url'] ?? '',
                    'role' => $user['role'],
                    'status' => 'active',
                    'createdAt' => $user['created_at'],
                    'lastLoginAt' => $user['last_login_at'] ?? null,
                    'lastLoginIp' => $user['last_login_ip'] ?? null,
                ]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    // 更新用户信息
    public function update() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $this->jsonResponse(['error' => '无效的请求数据'], 400);
            return;
        }
        
        $uid = intval($input['user_id'] ?? 0);
        if ($uid <= 0) {
            $this->jsonResponse(['error' => '参数错误'], 400);
            return;
        }
        
        try {
            $user = User::findById($uid);
            if (!$user) {
                $this->jsonResponse(['error' => '用户不存在'], 404);
                return;
            }
            
            // 更新用户信息
            User::updateUserInfo($uid, [
                'username' => $input['username'] ?? $user['username'],
                'name' => $input['name'] ?? $user['name'],
                'edu_system_username' => $input['edu_system_username'] ?? $user['edu_system_username'],
                'edu_system_password' => isset($input['edu_system_password']) && $input['edu_system_password'] !== '' 
                    ? $input['edu_system_password'] 
                    : $user['edu_system_password'],
            ]);
            
            // 更新小程序登录密码（如果提供）
            if (isset($input['password']) && $input['password'] !== '') {
                $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
                User::updatePassword($uid, $passwordHash);
            }
            
            // 更新角色
            if (isset($input['role']) && ($input['role'] === 'admin' || $input['role'] === 'user')) {
                User::updateRole($uid, $input['role']);
            }
            
            $currentAdminId = $this->getCurrentAdminId();
            SystemLog::log($currentAdminId ?? $uid, 'admin_user_updated', '管理员更新用户信息 UID: ' . $uid);
            
            $this->jsonResponse(['success' => true]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    // 获取当前登录的管理员 ID
    private function getCurrentAdminId() {
        // 确保 session 已启动
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // 从 session 中获取管理员 ID
        if (isset($_SESSION['admin_user_id'])) {
            return intval($_SESSION['admin_user_id']);
        }
        
        // 从 Authorization header 获取 token（如果使用了 JWT 或类似机制）
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        // 备选方案：从 token 中解析用户信息（需要实现 token 验证）
        // 这里返回 null，表示未找到当前用户
        return null;
    }
}

?>