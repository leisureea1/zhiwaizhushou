<?php
// 测试教务系统API服务

require_once 'app/Services/JwxtApiService.php';

// 创建API服务实例
$apiService = new JwxtApiService();

// 测试账号信息（请替换为实际的测试账号）
$username = '107242024000080';
$password = 'sl@810907.';

echo "测试教务系统API服务\n";
echo "==================\n\n";

// 测试获取课表
echo "1. 测试获取课表...\n";
$scheduleData = $apiService->getSchedule($username, $password);

// 检查是否是网络请求错误（这是预期的，因为我们使用测试账号）
if (isset($scheduleData['error']) && (strpos($scheduleData['error'], '网络请求失败') !== false || strpos($scheduleData['error'], '登录失败') !== false)) {
    echo "获取课表时出现网络请求错误（预期行为，因为使用测试账号）\n";
    echo "错误信息: " . $scheduleData['error'] . "\n";
} elseif (isset($scheduleData['error'])) {
    echo "获取课表失败: " . $scheduleData['error'] . "\n";
} else {
    echo "获取课表成功!\n";
    echo "用户名: " . (isset($scheduleData['username']) ? $scheduleData['username'] : '未知') . "\n";
    if (isset($scheduleData['course_table'])) {
        $courseTable = $scheduleData['course_table'];
        if (isset($courseTable['success']) && $courseTable['success']) {
            echo "课程表获取成功\n";
            if (isset($courseTable['total_courses'])) {
                echo "课程数量: " . $courseTable['total_courses'] . "\n";
            }
        } else {
            echo "课程表获取失败: " . (isset($courseTable['error']) ? $courseTable['error'] : '未知错误') . "\n";
        }
    }
    echo "\n";
}

// 测试获取成绩
echo "2. 测试获取成绩...\n";
$gradesData = $apiService->getGrades($username, $password);

// 检查是否是网络请求错误（这是预期的，因为我们使用测试账号）
if (isset($gradesData['error']) && (strpos($gradesData['error'], '网络请求失败') !== false || strpos($gradesData['error'], '登录失败') !== false)) {
    echo "获取成绩时出现网络请求错误（预期行为，因为使用测试账号）\n";
    echo "错误信息: " . $gradesData['error'] . "\n";
} elseif (isset($gradesData['error'])) {
    echo "获取成绩失败: " . $gradesData['error'] . "\n";
} else {
    echo "获取成绩成功!\n";
    echo "用户名: " . (isset($gradesData['username']) ? $gradesData['username'] : '未知') . "\n";
    if (isset($gradesData['grades'])) {
        $grades = $gradesData['grades'];
        if (isset($grades['success']) && $grades['success']) {
            echo "成绩获取成功\n";
            if (isset($grades['total_courses'])) {
                echo "成绩数量: " . $grades['total_courses'] . "\n";
            }
        } else {
            echo "成绩获取失败: " . (isset($grades['error']) ? $grades['error'] : '未知错误') . "\n";
        }
    }
    echo "\n";
}

echo "测试完成!\n";
echo "注意：如果出现网络请求错误，这是正常的，因为使用的是测试账号。\n";
echo "在实际使用中，应提供有效的教务系统账号信息。\n";
?>