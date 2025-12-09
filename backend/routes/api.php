<?php
// API路由定义文件

// 用户相关路由
$router->add('POST', '/api/user/register', 'UserController@register');
$router->add('POST', '/api/user/login', 'UserController@login');
$router->add('POST', '/api/user/change-password', 'UserController@changePassword');
$router->add('POST', '/api/user/get-detail', 'UserController@getUserDetail');
$router->add('POST', '/api/user/verify-jwxt', 'UserController@verifyJwxtCredentials');
$router->add('POST', '/api/user/get-jwxt-userinfo', 'UserController@getJwxtUserInfo');
$router->add('POST', '/api/user/validate-credentials', 'UserController@validateUserCredentials');
$router->add('POST', '/api/user/reset-password', 'UserController@resetPassword');
$router->add('POST', '/api/user/update-avatar', 'UserController@updateAvatar');

// 管理员认证相关路由
$router->add('POST', '/api/admin/login', 'AdminAuthController@login');
$router->add('POST', '/api/admin/logout', 'AdminAuthController@logout');

// 管理员仪表板相关路由
$router->add('GET', '/api/admin/dashboard/stats', 'AdminDashboardController@getStats');
$router->add('GET', '/api/admin/dashboard/recent-announcements', 'AdminDashboardController@getRecentAnnouncements');
$router->add('GET', '/api/admin/dashboard/pending-items', 'AdminDashboardController@getPendingItems');

// 课程相关路由
$router->add('GET', '/api/course/schedule', 'CourseController@getSchedule');
$router->add('GET', '/api/course/grades', 'CourseController@getGrades');
$router->add('GET', '/api/course/semesters', 'CourseController@getSemesters');

// 公告相关路由
$router->add('GET', '/api/announcement/list', 'AnnouncementController@getList');
$router->add('GET', '/api/announcement/detail', 'AnnouncementController@getDetail');
$router->add('GET', '/api/announcement/pinned', 'AnnouncementController@getPinnedForUser');
$router->add('POST', '/api/announcement/create', 'AnnouncementController@create');
$router->add('POST', '/api/announcement/update', 'AnnouncementController@update');
$router->add('POST', '/api/announcement/delete', 'AnnouncementController@delete');
$router->add('POST', '/api/announcement/mark-viewed', 'AnnouncementController@markViewed');
$router->add('POST', '/api/announcement/set-pinned', 'AnnouncementController@setPinned');

// 跳蚤市场相关路由
$router->add('GET', '/api/flea-market/list', 'FleaMarketController@getList');
$router->add('POST', '/api/flea-market/create', 'FleaMarketController@create');
$router->add('POST', '/api/flea-market/update', 'FleaMarketController@update');
$router->add('POST', '/api/flea-market/delete', 'FleaMarketController@delete');

// 失物招领相关路由
$router->add('GET', '/api/lost-found/list', 'LostFoundController@getList');
$router->add('POST', '/api/lost-found/create', 'LostFoundController@create');
$router->add('POST', '/api/lost-found/update', 'LostFoundController@update');
$router->add('POST', '/api/lost-found/delete', 'LostFoundController@delete');

// 管理员-跳蚤市场审核路由
$router->add('POST', '/api/admin/flea-market/review', 'FleaMarketController@review');

// 管理员-失物招领审核路由
$router->add('POST', '/api/admin/lost-found/review', 'LostFoundController@review');

// 管理员-用户管理路由
$router->add('GET', '/api/admin/users/list', 'AdminUserController@getList');
$router->add('POST', '/api/admin/users/update-role', 'AdminUserController@updateRole');
$router->add('POST', '/api/admin/users/delete', 'AdminUserController@delete');

// 管理员-系统日志路由
$router->add('GET', '/api/admin/system-logs/list', 'SystemLogController@getList');
$router->add('GET', '/api/admin/system-logs/action-types', 'SystemLogController@getActionTypes');
$router->add('GET', '/api/admin/system-logs/stats', 'SystemLogController@getStats');

// 管理员-通知管理路由
$router->add('GET', '/api/admin/notifications/settings', 'NotificationController@getSettings');
$router->add('POST', '/api/admin/notifications/settings', 'NotificationController@updateSettings');
$router->add('POST', '/api/admin/notifications/test-bark', 'NotificationController@testBark');

// 功能开关相关路由（小程序端）
$router->add('GET', '/api/feature/settings', 'FeatureController@getFeatureSettings');
$router->add('GET', '/api/feature/check', 'FeatureController@checkFeature');

// 管理员-功能开关管理路由
$router->add('GET', '/api/admin/features/list', 'AdminFeatureController@getFeatureList');
$router->add('POST', '/api/admin/features/update', 'AdminFeatureController@updateFeature');
$router->add('POST', '/api/admin/features/toggle', 'AdminFeatureController@toggleFeature');

