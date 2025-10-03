<?php
// 管理员认证控制器

require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';

class AdminAuthController {
    /**
     * 管理员登录
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
        if (empty($input['student_id']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => '学号和密码不能为空']);
            return;
        }
        
        try {
            // 查找用户
            $user = User::findByStudentId($input['student_id']);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => '学号或密码错误']);
                return;
            }
            
            // 验证密码
            if (!password_verify($input['password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => '学号或密码错误']);
                SystemLog::log($user['uid'], 'admin_login_failed', '管理员登录密码错误');
                return;
            }
            
            // 检查用户是否为管理员
            if ($user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => '您没有管理员权限']);
                SystemLog::log($user['uid'], 'admin_login_failed', '非管理员用户尝试登录后台');
                return;
            }
            
            // 生成访问令牌（简化实现，实际应使用JWT等）
            $token = bin2hex(random_bytes(32));
            
            // 记录日志
            SystemLog::log($user['uid'], 'admin_login', '管理员登录成功');
            
            // 返回成功响应
            echo json_encode([
                'message' => '登录成功',
                'user_id' => $user['uid'],
                'student_id' => $user['student_id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'token' => $token
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '登录失败: ' . $e->getMessage()]);
            SystemLog::log(null, 'admin_login_error', '管理员登录失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 管理员登出
     */
    public function logout() {
        // 在实际应用中，应该从数据库或缓存中删除令牌
        // 这里简化处理，直接返回成功消息
        echo json_encode(['message' => '登出成功']);
    }
}