<?php
// 用户控制器

require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class UserController {
    /**
     * 用户注册
     */
    public function register() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        $requiredFields = ['username', 'name', 'password', 'edu_system_username', 'edu_system_password'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "缺少必填字段: $field"]);
                return;
            }
        }
        
        try {
            // 检查用户名是否已存在
            if (User::findByUsername($input['username'])) {
                http_response_code(409);
                echo json_encode(['error' => '该用户名已被注册']);
                return;
            }

            // 检查学号是否已存在
            if (User::findByEduSystemUsername($input['edu_system_username'])) {
                http_response_code(409);
                echo json_encode(['error' => '该学号已被注册']);
                return;
            }
            
            // 密码加密
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // 创建用户
            $userId = User::create([
                'username' => $input['username'],
                'name' => $input['name'],
                'password_hash' => $passwordHash,
                'avatar_url' => $input['avatar_url'] ?? null,
                'edu_system_username' => $input['edu_system_username'],
                'edu_system_password' => $input['edu_system_password'] // 明文存储（按要求）
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'user_register', '用户注册成功');
            
            // 返回成功响应
            echo json_encode([
                'message' => '注册成功',
                'user_id' => $userId,
                'avatar_url' => $input['avatar_url'] ?? null
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '注册失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'user_register_error', '注册失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 用户登录
     */
    public function login() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => '用户名和密码不能为空']);
            return;
        }
        
        try {
            // 通过用户名查找
            $user = User::findByUsername($username);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => '用户名或密码错误']);
                return;
            }
            
            // 验证密码
            if (!password_verify($password, $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => '用户名或密码错误']);
                SystemLog::log($user['uid'], 'login_failed', '密码错误');
                return;
            }
            
            // 生成访问令牌（简化实现，实际应使用JWT等）
            $token = bin2hex(random_bytes(32));
            
            // 获取客户端IP地址
            $loginIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            if (strpos($loginIp, ',') !== false) {
                $loginIp = explode(',', $loginIp)[0];
            }
            $loginIp = trim($loginIp);
            
            // 更新登录信息
            User::updateLoginInfo($user['uid'], $loginIp);
            
            // 记录日志
            SystemLog::log($user['uid'], 'user_login', '用户登录成功，IP: ' . $loginIp);
            
            // 返回成功响应
            echo json_encode([
                'message' => '登录成功',
                'user_id' => $user['uid'],
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role'],
                'token' => $token,
                'edu_system_username' => $user['edu_system_username'],
                'edu_system_password' => $user['edu_system_password'],
                'avatar_url' => $user['avatar_url'] ?? null
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '登录失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'user_login_error', '登录失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取用户详细信息（从教务系统）
     */
    public function getUserDetail() {
        // 获取请求数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户ID不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findById($input['user_id']);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 使用教务系统账号获取详细信息
            require_once dirname(__DIR__) . '/Services/JwxtApiService.php';
            $jwxtService = new JwxtApiService();
            
            $userInfo = $jwxtService->getUserInfo(
                $user['edu_system_username'],
                $user['edu_system_password']
            );
            
            if (isset($userInfo['error'])) {
                http_response_code(500);
                echo json_encode(['error' => '获取用户信息失败: ' . $userInfo['error']]);
                return;
            }
            
            // 返回用户信息
            echo json_encode([
                'success' => true,
                'student_id' => $userInfo['student_id'] ?? $user['student_id'],
                'student_code' => $userInfo['student_code'] ?? null,
                'name' => $userInfo['name'] ?? $user['name'],
                'department' => $userInfo['department'] ?? null,
                'major' => $userInfo['major'] ?? null,
                'class_name' => $userInfo['class_name'] ?? null,
                'grade' => $userInfo['grade'] ?? null,
                'current_week' => $userInfo['current_week'] ?? null,
                'current_semester' => $userInfo['current_semester'] ?? null,
                'semester_name' => $userInfo['semester_name'] ?? null
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 验证教务系统账号密码
     */
    public function verifyJwxtCredentials() {
        // 获取POST数据
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        require_once dirname(__DIR__) . '/Utils/Logger.php';
        Logger::log('verifyJwxt.start', [
            'raw_body_len' => strlen($raw),
            'raw_snippet' => mb_substr($raw, 0, 200, 'UTF-8')
        ]);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            Logger::log('verifyJwxt.invalid_json', null);
            return;
        }
        
        // 验证必填字段
        if (empty($input['student_id']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => '学号和密码不能为空']);
            Logger::log('verifyJwxt.missing_fields', ['has_student_id' => !empty($input['student_id']), 'has_password' => !empty($input['password'])]);
            return;
        }
        
        try {
            // 调用教务系统API验证
            require_once dirname(__DIR__) . '/Services/JwxtApiService.php';
            $jwxtService = new JwxtApiService();
            $t0 = microtime(true);
            
            // 尝试获取用户信息来验证账号密码
            $userInfo = $jwxtService->getUserInfo(
                $input['student_id'],
                $input['password']
            );
            $dt = round((microtime(true) - $t0) * 1000);
            Logger::log('verifyJwxt.after_service', ['elapsed_ms' => $dt, 'userInfo_keys' => is_array($userInfo) ? array_keys($userInfo) : gettype($userInfo)]);
            
            // 如果有错误，说明账号密码不正确或下游异常
            if (isset($userInfo['error'])) {
                Logger::log('verifyJwxt.service_error', $userInfo);
                $resp = [
                    'valid' => false,
                    'message' => '学号或密码错误',
                    // 调试信息（前端调试期可查看）
                    'debug' => [
                        'reason' => $userInfo['error'],
                        'detail' => $userInfo['detail'] ?? ($userInfo['trace'] ?? null)
                    ]
                ];
                echo json_encode($resp, JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // 验证成功
            Logger::log('verifyJwxt.success', ['student_id' => $input['student_id'], 'name' => $userInfo['name'] ?? null]);
            echo json_encode([
                'valid' => true,
                'message' => '验证成功'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            Logger::log('verifyJwxt.exception', ['msg' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            echo json_encode([
                'valid' => false,
                'error' => '验证失败: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * 从教务系统获取用户信息(姓名等)
     */
    public function getJwxtUserInfo() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['student_id']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => '学号和密码不能为空']);
            return;
        }
        
        try {
            // 调用教务系统API获取用户信息
            require_once dirname(__DIR__) . '/Services/JwxtApiService.php';
            $jwxtService = new JwxtApiService();
            
            $userInfo = $jwxtService->getUserInfo(
                $input['student_id'],
                $input['password']
            );
            
            if (isset($userInfo['error'])) {
                http_response_code(500);
                echo json_encode(['error' => '获取用户信息失败: ' . $userInfo['error']]);
                return;
            }
            
            // 返回用户信息
            echo json_encode([
                'success' => true,
                'name' => $userInfo['name'] ?? '',
                'student_id' => $userInfo['student_id'] ?? $input['student_id'],
                'department' => $userInfo['department'] ?? '',
                'major' => $userInfo['major'] ?? '',
                'class_name' => $userInfo['class_name'] ?? ''
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 验证用户凭据（用户名是否存在）
     */
    public function validateUserCredentials() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['username'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户名不能为空']);
            return;
        }
        
        try {
            // 查找用户（通过用户名）
            $user = User::findByUsername($input['username']);
            
            if (!$user) {
                echo json_encode([
                    'valid' => false,
                    'message' => '该用户名未注册'
                ]);
                return;
            }
            
            // 验证成功
            echo json_encode([
                'valid' => true,
                'user_id' => $user['uid'],
                'message' => '验证成功'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'valid' => false,
                'error' => '验证失败: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * 重置密码
     */
    public function resetPassword() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['user_id']) || empty($input['new_password'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户ID和新密码不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findById($input['user_id']);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 密码加密
            $passwordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
            
            // 更新密码
            $updated = User::updatePassword($input['user_id'], $passwordHash);
            
            if ($updated) {
                // 记录日志
                SystemLog::log(
                    $input['user_id'],
                    'reset_password',
                    '用户重置密码'
                );
                
                echo json_encode([
                    'success' => true,
                    'message' => '密码重置成功'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => '密码重置失败']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '重置失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 修改密码
     */
    public function changePassword() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['user_id']) || empty($input['old_password']) || empty($input['new_password'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户ID、旧密码和新密码不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findById($input['user_id']);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 验证旧密码
            if (!password_verify($input['old_password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => '旧密码错误']);
                SystemLog::log($user['uid'], 'change_password_failed', '旧密码错误');
                return;
            }
            
            // 加密新密码
            $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
            
            // 更新密码
            User::updatePassword($user['uid'], $newPasswordHash);
            
            // 记录日志
            SystemLog::log($user['uid'], 'password_changed', '密码修改成功');
            
            echo json_encode(['message' => '密码修改成功']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '修改失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'change_password_error', '修改密码失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 更新用户活跃状态（小程序启动时调用）
     */
    public function updateActivity() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户ID不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findById($input['user_id']);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 获取客户端IP地址
            $loginIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            if (strpos($loginIp, ',') !== false) {
                $loginIp = explode(',', $loginIp)[0];
            }
            $loginIp = trim($loginIp);
            
            // 更新登录信息
            User::updateLoginInfo($input['user_id'], $loginIp);
            
            echo json_encode([
                'success' => true,
                'message' => '活跃状态已更新'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新失败: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 更新用户头像
     */
    public function updateAvatar() {
        // 获取POST数据
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => '无效的请求数据']);
            return;
        }
        
        // 验证必填字段
        if (empty($input['user_id']) || empty($input['avatar_url'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户ID和头像URL不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findById($input['user_id']);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 更新头像
            User::updateAvatar($input['user_id'], $input['avatar_url']);
            
            // 记录日志
            SystemLog::log($input['user_id'], 'avatar_updated', '用户头像已更新: ' . $input['avatar_url']);
            
            echo json_encode([
                'success' => true,
                'message' => '头像更新成功',
                'avatar_url' => $input['avatar_url']
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '更新失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'avatar_update_error', '更新头像失败: ' . $e->getMessage());
        }
    }
}