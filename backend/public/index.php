<?php
// 校园小程序后端入口文件

// 定义项目根目录
define('ROOT_PATH', dirname(__DIR__));

// 自动加载
require_once ROOT_PATH . '/vendor/autoload.php';

// 引入配置文件
require_once ROOT_PATH . '/config/database.php';

// CORS支持 - 更健壮的处理（Origin 存在时回显，否则使用 * 并关闭 credentials）
function set_cors_headers_for_request() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowMethods = 'GET, POST, PUT, DELETE, OPTIONS';
    $allowHeaders = 'Content-Type, Authorization, X-Requested-With';

    if ($origin) {
        // 有 Origin 时严格回显并允许携带凭证
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    } else {
        // 无 Origin（如小程序开发者工具、服务端到服务端等）时放宽为 *，且不发送 credentials
        header('Access-Control-Allow-Origin: *');
        // 注意：根据规范，Access-Control-Allow-Credentials 不能与 * 同时使用
    }
    header("Access-Control-Allow-Methods: $allowMethods");
    header("Access-Control-Allow-Headers: $allowHeaders");
}

// 处理预检请求（OPTIONS）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    set_cors_headers_for_request();
    header('Access-Control-Max-Age: 86400'); // 24小时
    http_response_code(200);
    exit();
}

// 非预检请求同样设置 CORS 头
set_cors_headers_for_request();

// 简单的路由处理
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// 移除查询字符串
if (($pos = strpos($request_uri, '?')) !== false) {
    $request_uri = substr($request_uri, 0, $pos);
}

// 移除脚本名称前缀
$script_name = $_SERVER['SCRIPT_NAME'];
if (strpos($request_uri, $script_name) === 0) {
    $request_uri = substr($request_uri, strlen($script_name));
}

// 移除前导斜杠
$request_uri = ltrim($request_uri, '/');

// 路由分发
try {
    if (!function_exists('json_response')) {
        function json_response($data, $statusCode = 200) {
            http_response_code($statusCode);
            if (!headers_sent()) {
                header('Content-Type: application/json; charset=utf-8');
            }
            echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    // 基础URL工具函数
    if (!function_exists('get_base_url')) {
        function get_base_url() {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            return $scheme . '://' . $host;
        }
    }
    if (!function_exists('abs_url')) {
        function abs_url($path) {
            if (!$path) return '';
            if (preg_match('#^https?://#i', $path)) return $path;
            return get_base_url() . $path;
        }
    }
    // API路由
    if (strpos($request_uri, 'api/') === 0) {
        $api_path = substr($request_uri, 4); // 移除 'api/' 前缀
        
        // 根据路径分发到相应的控制器
        handle_api_request($api_path, $request_method);
    } 
    // 后台管理路由
    elseif (strpos($request_uri, 'admin/') === 0) {
        $admin_path = substr($request_uri, 6); // 移除 'admin/' 前缀
        
        // 如果访问的是 /admin（没有子路径），直接重定向到登录页面
        if ($admin_path === '') {
            header('Location: /admin/login');
            exit();
        }
        
        // 后台管理页面
        handle_admin_request($admin_path);
    } 
    // 默认首页
    else {
        json_response(['message' => '校园小程序后端服务运行中']);
    }
} catch (Exception $e) {
    http_response_code(500);
    json_response(['error' => '服务器内部错误: ' . $e->getMessage()], 500);
}

/**
 * 处理API请求
 */
function handle_api_request($path, $method) {
    if (!headers_sent()) { header('Content-Type: application/json; charset=utf-8'); }
    
    // 根据路径分发到相应的控制器
    switch ($path) {
        case 'user/register':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->register();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/login':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->login();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/change-password':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->changePassword();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/get-detail':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->getUserDetail();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/verify-jwxt':
            if ($method === 'POST') {
                // 入口日志
                try {
                    require_once ROOT_PATH . '/app/Utils/Logger.php';
                    $raw = file_get_contents('php://input');
                    Logger::log('route.user.verify-jwxt', [
                        'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
                        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? '',
                        'raw_snippet' => mb_substr($raw, 0, 200, 'UTF-8')
                    ]);
                } catch (Throwable $e) { /* ignore */ }
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->verifyJwxtCredentials();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/get-jwxt-userinfo':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->getJwxtUserInfo();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/validate-credentials':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->validateUserCredentials();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/reset-password':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->resetPassword();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/update-activity':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->updateActivity();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/update-avatar':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->updateAvatar();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/schedule':
        case 'course/schedule':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/CourseController.php';
                $controller = new CourseController();
                $controller->getSchedule();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'user/grades':
        case 'course/grades':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/CourseController.php';
                $controller = new CourseController();
                $controller->getGrades();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'course/semesters':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/CourseController.php';
                $controller = new CourseController();
                $controller->getSemesters();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'course/exams':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/CourseController.php';
                $controller = new CourseController();
                $controller->getExams();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/login':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminAuthController.php';
                $controller = new AdminAuthController();
                $controller->login();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/logout':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminAuthController.php';
                $controller = new AdminAuthController();
                $controller->logout();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        // 管理员-用户管理API
        case 'admin/users/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->list();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
        case 'admin/users/create':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->create();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
        case 'admin/users/update-role':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->updateRole();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
        case 'admin/users/delete':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->delete();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
        case 'admin/users/detail':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->detail();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
        case 'admin/users/update':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminUserController.php';
                $controller = new AdminUserController();
                $controller->update();
            } else { http_response_code(405); echo json_encode(['error' => '方法不允许']); }
            break;
            
        case 'admin/dashboard/stats':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminDashboardController.php';
                $controller = new AdminDashboardController();
                $controller->getStats();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/dashboard/recent-announcements':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminDashboardController.php';
                $controller = new AdminDashboardController();
                $controller->getRecentAnnouncements();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/dashboard/pending-items':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminDashboardController.php';
                $controller = new AdminDashboardController();
                $controller->getPendingItems();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        // 系统日志管理
        case 'admin/system-logs/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/SystemLogController.php';
                $controller = new SystemLogController();
                $controller->getList();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/system-logs/action-types':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/SystemLogController.php';
                $controller = new SystemLogController();
                $controller->getActionTypes();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/system-logs/stats':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/SystemLogController.php';
                $controller = new SystemLogController();
                $controller->getStats();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        // 通知管理
        case 'admin/notifications/settings':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/NotificationController.php';
                $controller = new NotificationController();
                $controller->getSettings();
            } elseif ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/NotificationController.php';
                $controller = new NotificationController();
                $controller->updateSettings();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/notifications/test-bark':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/NotificationController.php';
                $controller = new NotificationController();
                $controller->testBark();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        // 功能开关管理（管理后台）
        case 'admin/features/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AdminFeatureController.php';
                $db = DatabaseConfig::getConnection();
                $controller = new App\Controllers\AdminFeatureController($db);
                $controller->getFeatureList();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/features/update':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminFeatureController.php';
                $db = DatabaseConfig::getConnection();
                $controller = new App\Controllers\AdminFeatureController($db);
                $controller->updateFeature();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/features/toggle':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AdminFeatureController.php';
                $db = DatabaseConfig::getConnection();
                $controller = new App\Controllers\AdminFeatureController($db);
                $controller->toggleFeature();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'admin/lost-found/delete':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                $controller->adminDelete();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        // 公告模块（小程序前台使用）
        case 'announcement/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->getList();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/detail':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->getDetail();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/create':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->create();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/update':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->update();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/delete':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->delete();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/pinned':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->getPinnedForUser();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/mark-viewed':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->markViewed();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcement/set-pinned':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->setPinned();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'announcements':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/AnnouncementController.php';
                $controller = new AnnouncementController();
                $controller->getList();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'flea-market':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                if (!empty($_GET['id'])) {
                    $controller->getDetail();
                } else {
                    $controller->getList();
                }
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'flea-market/create':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                $controller->create();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'flea-market/update':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                $controller->update();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'flea-market/delete':
            if ($method === 'POST' || $method === 'DELETE') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                $controller->delete();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
        
        case 'flea-market/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                $controller->getList();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
        
        case 'flea-market/review':
        case 'flea-market/approve':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/FleaMarketController.php';
                $controller = new FleaMarketController();
                $controller->review();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'lost-found':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                if (!empty($_GET['id'])) {
                    $controller->getDetail();
                } else {
                    $controller->getList();
                }
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'lost-found/create':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                $controller->create();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
        
        case 'lost-found/update':
            if ($method === 'POST') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                $controller->update();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;

        case 'lost-found/delete':
            if ($method === 'POST' || $method === 'DELETE') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                $controller->delete();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
        
        // 功能开关相关路由（小程序端）
        case 'feature/settings':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/FeatureController.php';
                $db = DatabaseConfig::getConnection();
                $controller = new App\Controllers\FeatureController($db);
                $controller->getFeatureSettings();
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
            
        case 'feature/check':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/FeatureController.php';
                $db = DatabaseConfig::getConnection();
                $featureKey = $_GET['feature_key'] ?? '';
                $controller = new App\Controllers\FeatureController($db);
                $controller->checkFeature($featureKey);
            } else {
                http_response_code(405);
                echo json_encode(['error' => '方法不允许']);
            }
            break;
        
        case 'upload/image':
            if ($method === 'POST') {
                header('Content-Type: application/json');
                try {
                    // 调试日志
                    require_once ROOT_PATH . '/app/Utils/Logger.php';
                    Logger::log('upload.debug', [
                        'FILES' => $_FILES,
                        'POST' => $_POST,
                        'GET' => $_GET,
                        'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
                        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? ''
                    ]);

                    // Token校验：允许头像等公开用途跳过鉴权（public=1），其余必须携带Authorization
                    $isPublic = isset($_GET['public']) && $_GET['public'] === '1';
                    if (!$isPublic) {
                        $headers = function_exists('getallheaders') ? getallheaders() : [];
                        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
                        if (!preg_match('/^Bearer\s+([A-Za-z0-9]+)$/', $authHeader, $m) || strlen($m[1]) < 40) {
                            http_response_code(401);
                            echo json_encode(['error' => '未授权的上传请求']);
                            break;
                        }
                    }

                    // 放宽上传限制（开发环境下）
                    @ini_set('upload_max_filesize', '100M');
                    @ini_set('post_max_size', '110M');
                    @ini_set('max_file_uploads', '20');
                    @ini_set('memory_limit', '512M');
                    require_once ROOT_PATH . '/app/Services/ImageService.php';

                    // 兼容不同字段名与多文件数组
                    $fileField = null;
                    foreach (['file','image','upload'] as $key) {
                        if (isset($_FILES[$key])) { $fileField = $key; break; }
                    }
                    if ($fileField === null) {
                        http_response_code(400);
                        echo json_encode([
                            'error' => '缺少文件字段（file/image）',
                            'debug' => [
                                'FILES_keys' => array_keys($_FILES),
                                'POST_keys' => array_keys($_POST)
                            ]
                        ]);
                        break;
                    }

                    $file = $_FILES[$fileField];
                    $tmpPath = '';
                    $origName = '';
                    if (is_array($file['tmp_name'])) {
                        // 取第一张
                        if (($file['error'][0] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                            $err = (int)($file['error'][0] ?? -1);
                            $msg = $err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE ? '文件过大，最大 100MB' : ('上传失败: 错误码 ' . $err);
                            http_response_code($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE ? 413 : 400);
                            echo json_encode(['error' => $msg]);
                            break;
                        }
                        $tmpPath = $file['tmp_name'][0] ?? '';
                        $origName = $file['name'][0] ?? 'image';
                    } else {
                        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                            $err = (int)($file['error'] ?? -1);
                            $msg = $err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE ? '文件过大，最大 100MB' : ('上传失败: 错误码 ' . $err);
                            http_response_code($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE ? 413 : 400);
                            echo json_encode(['error' => $msg]);
                            break;
                        }
                        $tmpPath = $file['tmp_name'] ?? '';
                        $origName = $file['name'] ?? 'image';
                    }

                    if (!$tmpPath || !file_exists($tmpPath)) {
                        http_response_code(400);
                        echo json_encode(['error' => '未收到有效文件']);
                        break;
                    }

                    // 安全校验：扩展名 & MIME
                    $allowedExt = ['jpg','jpeg','png','webp'];
                    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                    if (!in_array($ext, $allowedExt, true)) { json_response(['error' => '不支持的文件类型'], 415); break; }
                    // MIME 检查（防伪装）
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mime = $finfo->file($tmpPath) ?: '';
                    $allowedMime = ['image/jpeg','image/png','image/webp'];
                    if (!in_array($mime, $allowedMime, true)) { json_response(['error' => '非法的文件内容'], 415); break; }
                    // 基础图片检测
                    if (@getimagesize($tmpPath) === false) { json_response(['error' => '文件不是有效的图片'], 415); break; }

                    $filename = pathinfo($origName, PATHINFO_FILENAME) ?: 'image';
                    $destRel = '/uploads/' . date('Ymd') . '/' . uniqid($filename . '_') . '.webp';
                    $destAbs = ROOT_PATH . '/public' . $destRel;
                    $destDir = dirname($destAbs);
                    if (!is_dir($destDir)) { @mkdir($destDir, 0775, true); }

                    $result = ImageService::saveAsWebp($tmpPath, $destAbs, 1280, 80);

                    json_response([
                        'message' => '上传成功',
                        'url' => abs_url($destRel),
                        'width' => $result['width'],
                        'height' => $result['height']
                    ]);
                } catch (Exception $e) {
                    json_response(['error' => '上传失败: ' . $e->getMessage()], 500);
                }
            } else {
                json_response(['error' => '方法不允许'], 405);
            }
            break;
            
        case 'message/list':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Models/SystemLog.php';
                $userId = $_GET['user_id'] ?? null;
                $page = max(1, intval($_GET['page'] ?? 1));
                $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
                $offset = ($page - 1) * $limit;
                $action = $_GET['action'] ?? null;
                if (!$userId) { json_response(['error' => '缺少用户ID参数'], 400); break; }
                if ($action) {
                    $rows = SystemLog::getByUserIdWithAction($userId, $action, $limit, $offset);
                } else {
                    $rows = SystemLog::getByUserId($userId, $limit, $offset);
                }
                json_response(['message' => '获取消息成功', 'data' => $rows, 'pagination' => ['page'=>$page,'limit'=>$limit,'total'=>count($rows)]]);
            } else {
                json_response(['error' => '方法不允许'], 405);
            }
            break;

        case 'debug/db-charset':
            if ($method === 'GET') {
                if (!headers_sent()) { header('Content-Type: application/json; charset=utf-8'); }
                require_once ROOT_PATH . '/config/database.php';
                try {
                    $pdo = DatabaseConfig::getConnection();
                    $vars = $pdo->query("SHOW VARIABLES WHERE Variable_name IN ('character_set_client','character_set_connection','character_set_database','character_set_results','collation_connection','collation_database')")->fetchAll();
                    json_response(['ok' => true, 'vars' => $vars]);
                } catch (Exception $e) {
                    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
                }
            } else {
                json_response(['error' => '方法不允许'], 405);
            }
            break;

        default:
            json_response(['error' => '接口不存在'], 404);
            break;
    }
}

/**
 * 处理后台管理请求
 */
function handle_admin_request($path) {
    // 如果路径为空，设置为默认的index.php
    if (empty($path)) {
        $path = 'index.php';
    }
    
    // 构建后台管理页面路径
    $admin_file_path = ROOT_PATH . '/public/admin/' . $path;
    
    // 如果请求的是目录，则默认指向index.php
    if (substr($admin_file_path, -1) === '/') {
        $admin_file_path .= 'index.php';
    }
    
    // 如果请求的文件不存在，尝试添加.php扩展名
    if (!file_exists($admin_file_path) && !pathinfo($admin_file_path, PATHINFO_EXTENSION)) {
        $admin_file_path .= '.php';
    }
    
    // 检查文件是否存在
    if (file_exists($admin_file_path)) {
        require_once $admin_file_path;
    } else {
        // 如果是登录页面请求，显示登录页面
        if ($path === 'login' || $path === 'login.php') {
            require_once ROOT_PATH . '/public/admin/login.php';
        } else {
            http_response_code(404);
            echo "<h1>页面未找到</h1>";
            echo "<p>请求的页面: " . htmlspecialchars($path) . "</p>";
            echo "<a href='/admin'>返回后台首页</a>";
        }
    }
}