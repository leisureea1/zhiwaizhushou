<?php
/**
 * 教务系统API服务类
 * 直接调用Python API，避免使用命令行方式
 */

class JwxtApiService {
    private $pythonPath;
    private $crawlerDir;
    
    public function __construct() {
        $this->pythonPath = 'python3'; // 可根据需要调整Python路径
        $this->crawlerDir = dirname(__DIR__, 2) . '/../python/crawler';
    }
    
    /**
     * 通过Python API获取课表数据
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @param string $studentId 学号
     * @return array
     */
    public function getSchedule($username, $password, $studentId = null) {
        // 如果没有提供学号，则使用用户名作为学号
        if ($studentId === null) {
            $studentId = $username;
        }
        
        // 构建Python脚本
        $pythonCode = $this->buildPythonApiCall('schedule', $username, $password, $studentId);
        
        // 执行Python脚本
        return $this->executePythonScript($pythonCode);
    }
    
    /**
     * 通过Python API获取成绩数据
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @param string $studentId 学号
     * @param string $semesterId 学期ID（可选）
     * @return array
     */
    public function getGrades($username, $password, $studentId = null, $semesterId = null) {
        // 如果没有提供学号，则使用用户名作为学号
        if ($studentId === null) {
            $studentId = $username;
        }
        
        // 构建Python脚本
        $pythonCode = $this->buildPythonApiCall('grades', $username, $password, $studentId, null, $semesterId);
        
        // 执行Python脚本
        return $this->executePythonScript($pythonCode);
    }
    
    /**
     * 通过Python API获取可用学期列表
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @return array
     */
    public function getSemesters($username, $password) {
        // 构建Python脚本
        $pythonCode = $this->buildPythonSemestersCall($username, $password);
        
        // 执行Python脚本
        return $this->executePythonScript($pythonCode);
    }
    
    /**
     * 通过Python API获取用户详细信息
     *
     * @param string $username 用户名（学号）
     * @param string $password 密码
     * @return array
     */
    public function getUserInfo($username, $password) {
        // 构建Python脚本
        $pythonCode = $this->buildPythonUserInfoCall($username, $password);
        
        // 执行Python脚本
        return $this->executePythonScript($pythonCode);
    }
    
    /**
     * 构建获取学期列表的Python脚本
     *
     * @param string $username 用户名
     * @param string $password 密码
     * @return string
     */
    private function buildPythonSemestersCall($username, $password) {
        return "
import sys
import json
sys.path.insert(0, '{$this->crawlerDir}')

try:
    from jwxt_api import JwxtAPI
    
    # 创建API实例
    api = JwxtAPI()
    
    # 登录
    login_result = api.login('{$username}', '{$password}')
    
    if not login_result.get('success'):
        print(json.dumps({'error': '登录失败: ' + login_result.get('error', '未知错误'), 'success': False}, ensure_ascii=False))
        sys.exit(0)
    
    # 调用API获取学期列表
    semesters_data = api.get_available_semesters()
    
    # 输出结果
    print(json.dumps(semesters_data, ensure_ascii=False, indent=2))
    
except Exception as e:
    import traceback
    error_detail = traceback.format_exc()
    print(json.dumps({'error': 'Python异常: ' + str(e), 'success': False, 'detail': error_detail}, ensure_ascii=False))
    sys.exit(0)
";
    }
    
    /**
     * 构建调用Python user_info的脚本
     *
     * @param string $username 用户名
     * @param string $password 密码
     * @return string
     */
    private function buildPythonUserInfoCall($username, $password) {
        return "
import sys
import json
sys.path.insert(0, '{$this->crawlerDir}')

try:
    from jwxt_api import JwxtAPI
    
    # 创建API实例
    api = JwxtAPI()
    
    # 登录
    login_result = api.login('{$username}', '{$password}')
    
    if not login_result.get('success'):
        print(json.dumps({'error': '登录失败: ' + login_result.get('error', '未知错误')}))
        sys.exit(1)
    
    # 导入user_info模块
    from user_info import get_user_info
    
    # 获取用户信息
    user_info = get_user_info(api.session)
    
    # 输出结果
    print(json.dumps(user_info, ensure_ascii=False, indent=2))
    
except Exception as e:
    print(json.dumps({'error': 'Python异常: ' + str(e)}))
    sys.exit(1)
";
    }
    
    /**
     * 构建调用Python API的脚本
     *
     * @param string $action 操作类型 ('schedule' 或 'grades')
     * @param string $username 用户名
     * @param string $password 密码
     * @param string $studentId 学号
     * @param string $weekNumber 周次（可选）
     * @param string $semesterId 学期ID（可选）
     * @return string
     */
    private function buildPythonApiCall($action, $username, $password, $studentId, $weekNumber = null, $semesterId = null) {
        return "
import sys
import json
import os
import re

# 添加项目路径到Python路径
sys.path.insert(0, '" . dirname($this->crawlerDir) . "')
sys.path.insert(0, '{$this->crawlerDir}')

def extract_json_from_output(output):
    '''从可能包含警告信息的输出中提取JSON'''
    # 使用正则表达式匹配JSON对象
    json_pattern = r'\{(?:[^{}]|(?R))*\}'
    matches = re.findall(json_pattern, output, re.DOTALL)
    
    # 返回最后一个匹配的JSON（通常是实际的结果）
    if matches:
        return matches[-1]
    return None

try:
    # 导入模块
    from crawler.jwxt_api import JwxtAPI
    
    # 创建API实例
    api = JwxtAPI()
    
    # 登录
    login_result = api.login('{$username}', '{$password}')
    
    if not login_result.get('success'):
        print(json.dumps({'error': '登录失败: ' + login_result.get('error', '未知错误')}))
        sys.exit(1)
    
    result = {'username': '{$username}'}
    
    # 根据action执行操作
    if '{$action}' == 'schedule':
        # 步骤1: 获取用户信息（包含student_id）
        from user_info import get_user_info
        user_info = get_user_info(api.session)
        
        if not user_info.get('student_id'):
            result['error'] = '无法获取学生ID'
        else:
            # 步骤2: 获取学期信息
            from semester import get_semester_id
            semester_id = get_semester_id(api.session)
            
            if not semester_id:
                semester_id = '209'  # 使用默认学期
            
            # 步骤3: 获取课程表
            course_table = api.get_course_table(semester_id=semester_id, student_id=user_info['student_id'])
            
            # 确保返回正确的数据结构
            if course_table.get('success'):
                result['course_table'] = course_table
                # 兼容旧的数据结构
                if 'courses' in course_table:
                    result['courses'] = course_table['courses']
            else:
                result['error'] = '获取课表失败: ' + course_table.get('error', '未知错误')
    elif '{$action}' == 'grades':
        # 获取成绩
        semester_id_param = '{$semesterId}'
        semester_id = semester_id_param if semester_id_param and semester_id_param != '' else None
        
        grades = api.get_grades(semester_id=semester_id, summary=True)
        
        # 确保返回正确的数据结构
        if grades.get('success'):
            result['grades'] = grades.get('grades', [])
            result['statistics'] = grades.get('statistics', {})
            result['semester_id'] = grades.get('semester_id')
            # 兼容旧的数据结构
            if 'courses' in grades:
                result['grades_list'] = grades['courses']
        else:
            result['error'] = '获取成绩失败: ' + grades.get('error', '未知错误')
    
    # 输出结果
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
except Exception as e:
    import traceback
    error_detail = traceback.format_exc()
    print(f\"Error occurred: {str(e)}\", file=sys.stderr)
    print(f\"Traceback: {error_detail}\", file=sys.stderr)
    print(json.dumps({
        'success': False,
        'error': 'Python执行异常: ' + str(e),
        'detail': error_detail
    }, ensure_ascii=False))
    sys.exit(0)
";
    }
    
    /**
     * 执行Python脚本
     *
     * @param string $pythonCode Python代码
     * @return array
     */
    private function executePythonScript($pythonCode) {
        // 创建临时文件
        $tempFile = tempnam(sys_get_temp_dir(), 'jwxt_api_');
        file_put_contents($tempFile, $pythonCode);
        
        // 记录临时文件路径以便调试
        error_log("[JwxtApiService] Python temp file: " . $tempFile);
        
        try {
            // 执行Python脚本
            $command = "{$this->pythonPath} {$tempFile} 2>&1";
            $output = shell_exec($command);
            
            // 记录原始输出
            error_log("[JwxtApiService] Python output length: " . strlen($output));
            error_log("[JwxtApiService] Python output (first 1000 chars): " . substr($output, 0, 1000));
            
            // 删除临时文件
            unlink($tempFile);
            
            // 如果输出为空或只包含空白字符
            if (empty(trim($output))) {
                error_log("[JwxtApiService] Python script returned no output");
                return ['error' => 'Python脚本未返回任何输出'];
            }
            
            // 尝试从输出中提取JSON
            $jsonData = $this->extractJsonFromOutput($output);
            
            if ($jsonData === null) {
                // 检查是否是登录错误或其他明确的错误信息
                if (strpos($output, '401') !== false || strpos($output, '登录') !== false) {
                    return ['error' => '登录失败: 网络请求失败: 401 Client Error'];
                }
                error_log("[JwxtApiService] Failed to extract JSON from output");
                return ['error' => 'Python脚本输出无效: 无法解析JSON (输出: ' . substr($output, 0, 500) . ')'];
            }
            
            // 解析JSON输出
            $data = json_decode($jsonData, true);
            
            // 检查是否有错误
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['error' => 'Python脚本输出无效: ' . json_last_error_msg() . ' (输出: ' . substr($jsonData, 0, 500) . ')'];
            }
            
            // 检查返回的数据中是否有错误信息
            if (isset($data['error'])) {
                return $data;
            }
            
            return $data ?: ['error' => 'Python脚本未返回有效数据'];
        } catch (Exception $e) {
            // 确保删除临时文件
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            return ['error' => '执行Python脚本时发生错误: ' . $e->getMessage()];
        }
    }
    
    /**
     * 从可能包含警告信息的输出中提取JSON
     *
     * @param string $output Python脚本的完整输出
     * @return string|null 提取到的JSON字符串
     */
    private function extractJsonFromOutput($output) {
        // 移除可能的警告信息，只保留JSON部分
        // 查找第一个{和最后一个}之间的内容
        $start = strpos($output, '{');
        $end = strrpos($output, '}');
        
        if ($start !== false && $end !== false && $end > $start) {
            $jsonStr = substr($output, $start, $end - $start + 1);
            // 验证这是否是一个有效的JSON
            json_decode($jsonStr);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $jsonStr;
            }
        }
        
        return null;
    }
}
?>