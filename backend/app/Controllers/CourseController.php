<?php
// 课程控制器

require_once dirname(__DIR__) . '/Models/User.php';
require_once dirname(__DIR__) . '/Models/Course.php';
require_once dirname(__DIR__) . '/Models/SystemLog.php';
require_once dirname(__DIR__) . '/Services/JwxtApiService.php';

class CourseController {
    /**
     * 获取用户课表
     */
    public function getSchedule() {
        // 获取参数
        $userId = $_GET['user_id'] ?? null;
        $username = $_GET['username'] ?? null;
        $password = $_GET['password'] ?? null;
        $semesterId = $_GET['semester_id'] ?? null;
        
        // 如果提供了username和password，直接使用
        if ($username && $password) {
            try {
                // 调用Python爬虫获取课表数据
                $scheduleData = $this->fetchScheduleFromCrawler($username, $password, $semesterId);
                
                // 检查是否有错误信息
                if (isset($scheduleData['error'])) {
                    http_response_code(500);
                    echo json_encode(['error' => '获取课表失败: ' . $scheduleData['error']]);
                    return;
                }
                
                // 返回课表数据
                echo json_encode($scheduleData);
                return;
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => '获取课表失败: ' . $e->getMessage()]);
                return;
            }
        }
        
        // 否则使用user_id方式
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => '缺少必要参数']);
            return;
        }
        
        try {
            // 验证用户是否存在
            $user = User::findById($userId);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 检查是否有教务系统账号
            if (empty($user['edu_system_username']) || empty($user['edu_system_password'])) {
                http_response_code(400);
                echo json_encode(['error' => '未绑定教务系统账号']);
                return;
            }
            
            // 调用Python爬虫获取课表数据
            $scheduleData = $this->fetchScheduleFromCrawler($user['edu_system_username'], $user['edu_system_password'], $semesterId);
            
            // 检查是否有错误信息
            if (isset($scheduleData['error'])) {
                http_response_code(500);
                echo json_encode(['error' => '获取课表失败: ' . $scheduleData['error']]);
                SystemLog::log($userId, 'schedule_fetch_error', '获取课表失败: ' . $scheduleData['error']);
                return;
            }
            
            // 记录日志
            SystemLog::log($userId, 'schedule_fetched', '成功获取课表');
            
            // 直接返回课表数据，不保存到数据库
            echo json_encode([
                'message' => '课表获取成功',
                'data' => $scheduleData
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取课表失败: ' . $e->getMessage()]);
            SystemLog::log($userId, 'schedule_fetch_error', '获取课表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取用户成绩
     */
    public function getGrades() {
        // 获取用户ID和学期ID
        $userId = $_GET['user_id'] ?? null;
        $semesterId = $_GET['semester_id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => '缺少用户ID参数']);
            return;
        }
        
        try {
            // 验证用户是否存在
            $user = User::findById($userId);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 检查是否有教务系统账号
            if (empty($user['edu_system_username']) || empty($user['edu_system_password'])) {
                http_response_code(400);
                echo json_encode(['error' => '未绑定教务系统账号']);
                return;
            }
            
            // 调用Python爬虫获取成绩数据
            $gradesData = $this->fetchGradesFromCrawler($user['edu_system_username'], $user['edu_system_password'], $semesterId);
            
            // 检查是否有错误信息
            if (isset($gradesData['error']) || (isset($gradesData['success']) && !$gradesData['success'])) {
                $errorMsg = $gradesData['error'] ?? '未知错误';
                $errorDetail = $gradesData['detail'] ?? '';
                $errorTraceback = $gradesData['traceback'] ?? '';
                
                http_response_code(500);
                echo json_encode([
                    'error' => '获取成绩失败: ' . $errorMsg,
                    'detail' => $errorDetail,
                    'traceback' => $errorTraceback,
                    'semester_id' => $semesterId
                ]);
                SystemLog::log($userId, 'grades_fetch_error', '获取成绩失败: ' . $errorMsg . ' (学期: ' . $semesterId . ')');
                return;
            }
            
            // 记录日志
            SystemLog::log($userId, 'grades_fetched', '成功获取成绩');
            
            // 直接返回成绩数据，不保存到数据库
            echo json_encode([
                'success' => true,
                'message' => '成绩获取成功',
                'data' => $gradesData
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取成绩失败: ' . $e->getMessage()]);
            SystemLog::log($userId, 'grades_fetch_error', '获取成绩失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 调用Python爬虫获取课表数据
     */
    private function fetchScheduleFromCrawler($username, $password, $semesterId = null) {
        // 创建API服务实例
        $apiService = new JwxtApiService();
        
        // 调用API获取课表数据
        return $apiService->getSchedule($username, $password, $semesterId);
    }
    
    /**
     * 调用Python爬虫获取成绩数据
     */
    private function fetchGradesFromCrawler($username, $password, $semesterId = null) {
        // 创建API服务实例
        $apiService = new JwxtApiService();
        
        // 调用API获取成绩数据
        return $apiService->getGrades($username, $password, $semesterId);
    }
    
    /**
     * 获取可用学期列表
     */
    public function getSemesters() {
        // 获取用户ID
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => '缺少用户ID参数']);
            return;
        }
        
        try {
            // 验证用户是否存在
            $user = User::findById($userId);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => '用户不存在']);
                return;
            }
            
            // 检查是否有教务系统账号
            if (empty($user['edu_system_username']) || empty($user['edu_system_password'])) {
                http_response_code(400);
                echo json_encode(['error' => '未绑定教务系统账号']);
                return;
            }
            
            // 调用Python爬虫获取学期列表
            $apiService = new JwxtApiService();
            $semestersData = $apiService->getSemesters($user['edu_system_username'], $user['edu_system_password']);
            
            // 检查是否有错误信息
            if (isset($semestersData['error']) || !isset($semestersData['success']) || !$semestersData['success']) {
                $errorMsg = $semestersData['error'] ?? '未知错误';
                $errorDetail = $semestersData['detail'] ?? '';
                
                http_response_code(500);
                echo json_encode([
                    'error' => '获取学期列表失败: ' . $errorMsg,
                    'detail' => $errorDetail
                ]);
                SystemLog::log($userId, 'semesters_fetch_error', '获取学期列表失败: ' . $errorMsg);
                return;
            }
            
            // 返回学期数据
            echo json_encode([
                'success' => true,
                'message' => '学期列表获取成功',
                'data' => $semestersData
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => '获取学期列表失败: ' . $e->getMessage()]);
            SystemLog::log($userId, 'semesters_fetch_error', '获取学期列表失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取考试安排
     */
    public function getExams() {
        $username = $_GET['username'] ?? null;
        $password = $_GET['password'] ?? null;
        $semesterId = $_GET['semester_id'] ?? null;
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => '缺少必要参数']);
            return;
        }
        
        try {
            $apiService = new JwxtApiService();
            $examsData = $apiService->getExams($username, $password, $semesterId);
            
            if (isset($examsData['error']) || (isset($examsData['success']) && !$examsData['success'])) {
                $errorMsg = $examsData['error'] ?? '未知错误';
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => '获取考试安排失败: ' . $errorMsg
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'message' => '考试安排获取成功',
                'exams' => $examsData['exams'] ?? [],
                'total' => $examsData['total'] ?? 0
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => '获取考试安排失败: ' . $e->getMessage()
            ]);
        }
    }
}