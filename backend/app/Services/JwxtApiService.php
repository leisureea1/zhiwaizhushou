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
                'url' => preg_replace('/password=[^&]+/', 'password=***', $url)
            ]);
        }
        
        $t0 = microtime(true);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        $elapsed = round((microtime(true) - $t0) * 1000);
        
        if ($curlError) {
            error_log("[JwxtApiService] cURL error: {$curlError}");
            return [
                'success' => false,
                'error' => 'FastAPI 服务调用失败: ' . $curlError
            ];
        }
        
        if ($httpCode !== 200) {
            error_log("[JwxtApiService] HTTP error: {$httpCode}");
            return [
                'success' => false,
                'error' => 'FastAPI 服务返回错误: HTTP ' . $httpCode
            ];
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("[JwxtApiService] JSON error: " . json_last_error_msg());
            return [
                'success' => false,
                'error' => 'FastAPI 返回数据格式错误'
            ];
        }
        
        if (class_exists('Logger')) {
            Logger::log('JwxtApiService.response', [
                'endpoint' => $endpoint,
                'elapsed_ms' => $elapsed,
                'success' => $data['success'] ?? false
            ]);
        }
        
        return $data;
    }
    
    /**
     * 提取 data 字段内容（FastAPI 返回格式: {success, data, error}）
     */
    private function extractData($result) {
        if (isset($result['success']) && $result['success'] && isset($result['data'])) {
            return array_merge(['success' => true], $result['data']);
        }
        return $result;
    }
    
    /**
     * 获取课表数据
     *
     * @param string $username 学号
     * @param string $password 密码
     * @param string $semesterId 学期ID（可选）
     * @return array
     */
    public function getSchedule($username, $password, $semesterId = null) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        if ($semesterId !== null) {
            $params['semester_id'] = $semesterId;
        }
        
        $result = $this->callFastAPI('course', $params);
        return $this->extractData($result);
    }
    
    /**
     * 获取成绩数据
     *
     * @param string $username 学号
     * @param string $password 密码
     * @param string $semesterId 学期ID（可选）
     * @return array
     */
    public function getGrades($username, $password, $semesterId = null) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        if ($semesterId !== null) {
            $params['semester_id'] = $semesterId;
        }
        
        $result = $this->callFastAPI('grade', $params);
        return $this->extractData($result);
    }
    
    /**
     * 获取学期列表
     *
     * @param string $username 学号
     * @param string $password 密码
     * @return array
     */
    public function getSemesters($username, $password) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        $result = $this->callFastAPI('semester', $params);
        return $this->extractData($result);
    }
    
    /**
     * 获取用户信息
     *
     * @param string $username 学号
     * @param string $password 密码
     * @return array
     */
    public function getUserInfo($username, $password) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        $result = $this->callFastAPI('user', $params);
        return $this->extractData($result);
    }
    
    /**
     * 登录验证
     *
     * @param string $username 学号
     * @param string $password 密码
     * @return array
     */
    public function login($username, $password) {
        $params = [
            'username' => $username,
            'password' => $password
        ];
        
        $result = $this->callFastAPI('login', $params);
        return $this->extractData($result);
    }
}
