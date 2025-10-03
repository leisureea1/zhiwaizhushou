<?php
// 后台管理路由定义文件

// 后台首页
$router->add('GET', '/admin', 'AdminController@index');

// 用户管理
$router->add('GET', '/admin/users', 'AdminController@userList');
$router->add('GET', '/admin/users/:id', 'AdminController@userDetail');
$router->add('POST', '/admin/users/:id/update-role', 'AdminController@updateUserRole');

// 课程管理
$router->add('GET', '/admin/courses', 'AdminController@courseList');

// 公告管理
$router->add('GET', '/admin/announcements', 'AdminController@announcementList');
$router->add('GET', '/admin/announcements/create', 'AdminController@createAnnouncementForm');
$router->add('POST', '/admin/announcements/create', 'AdminController@createAnnouncement');
$router->add('GET', '/admin/announcements/:id/edit', 'AdminController@editAnnouncementForm');
$router->add('POST', '/admin/announcements/:id/edit', 'AdminController@editAnnouncement');
$router->add('POST', '/admin/announcements/:id/delete', 'AdminController@deleteAnnouncement');

// 跳蚤市场管理
$router->add('GET', '/admin/flea-market', 'AdminController@fleaMarketList');
$router->add('GET', '/admin/flea-market/pending', 'AdminController@pendingFleaMarketList');
$router->add('POST', '/admin/flea-market/:id/review', 'AdminController@reviewFleaMarketItem');

// 失物招领管理
$router->add('GET', '/admin/lost-found', 'AdminController@lostFoundList');
$router->add('GET', '/admin/lost-found/pending', 'AdminController@pendingLostFoundList');
$router->add('POST', '/admin/lost-found/:id/review', 'AdminController@reviewLostFoundItem');

// SMTP配置管理
$router->add('GET', '/admin/smtp', 'AdminController@smtpConfigForm');
$router->add('POST', '/admin/smtp', 'AdminController@updateSmtpConfig');

// 系统日志
$router->add('GET', '/admin/logs', 'AdminController@systemLogs');