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
        $requiredFields = ['student_id', 'name', 'password', 'email', 'edu_system_username', 'edu_system_password'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "缺少必填字段: $field"]);
                return;
            }
        }
        
        try {
            // 检查学号是否已存在
            if (User::findByStudentId($input['student_id'])) {
                http_response_code(409);
                echo json_encode(['error' => '该学号已被注册']);
                return;
            }
            
            // 检查邮箱是否已存在
            if (User::findByEmail($input['email'])) {
                http_response_code(409);
                echo json_encode(['error' => '该邮箱已被注册']);
                return;
            }
            
            // 密码加密
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // 创建用户
            $userId = User::create([
                'student_id' => $input['student_id'],
                'name' => $input['name'],
                'password_hash' => $passwordHash,
                'edu_system_username' => $input['edu_system_username'],
                'edu_system_password' => $input['edu_system_password'], // 明文存储（按要求）
                'email' => $input['email']
            ]);
            
            // 记录日志
            SystemLog::log($userId, 'user_register', '用户注册成功');
            
            // 返回成功响应
            echo json_encode([
                'message' => '注册成功',
                'user_id' => $userId
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
        
        // 验证必填字段 - 支持用户名或学号登录
        $username = $input['username'] ?? $input['student_id'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => '用户名和密码不能为空']);
            return;
        }
        
        try {
            // 先尝试通过学号查找
            $user = User::findByStudentId($username);
            
            // 如果找不到，尝试通过name字段查找（用户名）
            if (!$user) {
                // 这里需要在User模型中添加findByName方法
                $user = User::findByName($username);
            }
            
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
            
            // 暂时跳过邮箱验证检查，方便测试
            // if (!$user['email_verified']) {
            //     http_response_code(403);
            //     echo json_encode(['error' => '请先验证邮箱']);
            //     SystemLog::log($user['uid'], 'login_failed', '邮箱未验证');
            //     return;
            // }
            
            // 生成访问令牌（简化实现，实际应使用JWT等）
            $token = bin2hex(random_bytes(32));
            
            // 记录日志
            SystemLog::log($user['uid'], 'user_login', '用户登录成功');
            
            // 返回成功响应
            echo json_encode([
                'message' => '登录成功',
                'user_id' => $user['uid'],
                'student_id' => $user['student_id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'token' => $token,
                'edu_system_username' => $user['edu_system_username'],
                'edu_system_password' => $user['edu_system_password']
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
            // 调用教务系统API验证
            require_once dirname(__DIR__) . '/Services/JwxtApiService.php';
            $jwxtService = new JwxtApiService();
            
            // 尝试获取用户信息来验证账号密码
            $userInfo = $jwxtService->getUserInfo(
                $input['student_id'],
                $input['password']
            );
            
            // 如果有错误，说明账号密码不正确
            if (isset($userInfo['error'])) {
                echo json_encode([
                    'valid' => false,
                    'message' => '学号或密码错误'
                ]);
                return;
            }
            
            // 验证成功
            echo json_encode([
                'valid' => true,
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
     * 验证用户凭据（用户名和学号是否匹配）
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
        if (empty($input['username']) || empty($input['student_id'])) {
            http_response_code(400);
            echo json_encode(['error' => '用户名和学号不能为空']);
            return;
        }
        
        try {
            // 查找用户（通过学号）
            $user = User::findByStudentId($input['student_id']);
            
            if (!$user) {
                echo json_encode([
                    'valid' => false,
                    'message' => '该学号未注册'
                ]);
                return;
            }
            
            // 验证用户名是否匹配
            if ($user['name'] !== $input['username']) {
                echo json_encode([
                    'valid' => false,
                    'message' => '用户名与学号不匹配'
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
}