<?php
// 校园小程序后端入口文件

// 定义项目根目录
define('ROOT_PATH', dirname(__DIR__));

// 自动加载
require_once ROOT_PATH . '/vendor/autoload.php';

// 引入配置文件
require_once ROOT_PATH . '/config/database.php';

// CORS支持 - 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // 设置CORS头
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400'); // 24小时
    
    // 对于OPTIONS请求，直接返回200
    http_response_code(200);
    exit();
}

// 设置CORS头（对于非OPTIONS请求）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
        echo json_encode(['message' => '校园小程序后端服务运行中']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => '服务器内部错误: ' . $e->getMessage()]);
}

/**
 * 处理API请求
 */
function handle_api_request($path, $method) {
    header('Content-Type: application/json');
    
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
                require_once ROOT_PATH . '/app/Controllers/UserController.php';
                $controller = new UserController();
                $controller->verifyJwxtCredentials();
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
                $controller->getList();
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
            
        case 'lost-found':
            if ($method === 'GET') {
                require_once ROOT_PATH . '/app/Controllers/LostFoundController.php';
                $controller = new LostFoundController();
                $controller->getList();
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
            
        default:
            http_response_code(404);
            echo json_encode(['error' => '接口不存在']);
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