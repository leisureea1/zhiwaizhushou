<?php
/**
 * 教务系统API服务类
 * 通过调用 FastAPI 服务来访问教务系统数据
 */

class JwxtApiService {
    private $apiBaseUrl;
    
    public function __construct() {
        require_once dirname(__DIR__) . '/Utils/Logger.php';
        // FastAPI 服务的基础 URL
        $this->apiBaseUrl = 'http://127.0.0.1:8000';
        
        if (class_exists('Logger')) {
            Logger::log('JwxtApiService.init', [
                'apiBaseUrl' => $this->apiBaseUrl,
            ]);
        }
    }
    
    /**
     * 调用 FastAPI 接口的通用方法
     *
     * @param string $endpoint API 端点（如 'course', 'grade' 等）
     * @param array $params GET 参数数组
     * @return array
     */
    private function callFastAPI($endpoint, $params) {
        $url = $this->apiBaseUrl . '/' . $endpoint . '?' . http_build_query($params);
        
        if (class_exists('Logger')) {
            Logger::log('JwxtApiService.callFastAPI', [
                'endpoint' => $endpoint,
                'url' => $url
            ]);
        }
        
        $t0 = microtime(true);
        
        // 使用 cURL 调用 API（更可靠且支持错误处理）
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30秒超时
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // 10秒连接超时
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        $elapsed = round((microtime(true) - $t0) * 1000);
        
        if ($curlError) {
            error_log("[JwxtApiService] cURL error: {$curlError}");
            if (class_exists('Logger')) {
                Logger::log('JwxtApiService.curl_error', ['error' => $curlError]);
            }
            return [
                'success' => false,
                'error' => 'FastAPI 服务调用失败: ' . $curlError
            ];
        }
        
        if ($httpCode !== 200) {
            error_log("[JwxtApiService] HTTP error code: {$httpCode}");
            if (class_exists('Logger')) {
                Logger::log('JwxtApiService.http_error', ['code' => $httpCode]);
            }
            return [
                'success' => false,
                'error' => 'FastAPI 服务返回错误: HTTP ' . $httpCode
            ];
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("[JwxtApiService] JSON decode error: " . json_last_error_msg());
            if (class_exists('Logger')) {
                Logger::log('JwxtApiService.json_error', [
                    'error' => json_last_error_msg(),
                    'response' => substr($response, 0, 500)
                ]);
            }
            return [
                'success' => false,
                'error' => 'FastAPI 返回数据格式错误: ' . json_last_error_msg()
            ];
        }
        
        if (class_exists('Logger')) {
            Logger::log('JwxtApiService.response', [
                'elapsed_ms' => $elapsed,
                'success' => $data['success'] ?? false
            ]);
        }
        
        return $data;
    }
    
    /**
     * 通过 FastAPI 获取课表数据
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @param string $studentId 学号（可选，未使用但保持兼容性）
     * @return array
     */
    public function getSchedule($username, $password, $studentId = null) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        $result = $this->callFastAPI('course', $params);
        
        // 兼容旧的数据结构
        if (isset($result['success']) && $result['success'] && isset($result['data'])) {
            // 将 data 字段展开到根级别，以保持向后兼容
            $data = $result['data'];
            if (isset($data['courses'])) {
                $result['courses'] = $data['courses'];
            }
            if (isset($data['course_table'])) {
                $result['course_table'] = $data['course_table'];
            }
        }
        
        return $result;
    }
    
    /**
     * 通过 FastAPI 获取成绩数据
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @param string $studentId 学号（可选，未使用但保持兼容性）
     * @param string $semesterId 学期ID（可选）
     * @return array
     */
    public function getGrades($username, $password, $studentId = null, $semesterId = null) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        if ($semesterId !== null) {
            $params['semester_id'] = $semesterId;
        }
        
        $result = $this->callFastAPI('grade', $params);
        
        // 兼容旧的数据结构
        if (isset($result['success']) && $result['success'] && isset($result['data'])) {
            $data = $result['data'];
            if (isset($data['grades'])) {
                $result['grades'] = $data['grades'];
            }
            if (isset($data['statistics'])) {
                $result['statistics'] = $data['statistics'];
            }
            if (isset($data['semester_id'])) {
                $result['semester_id'] = $data['semester_id'];
            }
        }
        
        return $result;
    }
    
    /**
     * 通过 FastAPI 获取可用学期列表
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @return array
     */
    public function getSemesters($username, $password) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        return $this->callFastAPI('semester', $params);
    }
    
    /**
     * 通过 FastAPI 获取用户详细信息
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @return array
     */
    public function getUserInfo($username, $password) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        $result = $this->callFastAPI('user', $params);
        
        // 兼容旧的数据结构：将 data 字段的内容提升到根级别
        if (isset($result['success']) && $result['success'] && isset($result['data'])) {
            $result = array_merge($result, $result['data']);
        }
        
        return $result;
    }
}
?>