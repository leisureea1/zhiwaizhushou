<?php
// API路由定义文件

// 用户相关路由
$router->add('POST', '/api/user/register', 'UserController@register');
$router->add('POST', '/api/user/login', 'UserController@login');
$router->add('POST', '/api/user/change-password', 'UserController@changePassword');
$router->add('POST', '/api/user/get-detail', 'UserController@getUserDetail');
$router->add('POST', '/api/user/verify-jwxt', 'UserController@verifyJwxtCredentials');

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
$router->add('POST', '/api/announcement/create', 'AnnouncementController@create');
$router->add('POST', '/api/announcement/update', 'AnnouncementController@update');
$router->add('POST', '/api/announcement/delete', 'AnnouncementController@delete');

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