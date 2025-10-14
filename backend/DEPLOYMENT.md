# 部署到云服务器指南

本后端是一个单入口（public/index.php）的 PHP 应用。本地用 PHP 内置开发服务器时（如 `php -S 0.0.0.0:8000 -t public public/router.php`），所有请求会自动被路由到 `public/index.php`。若在 Nginx/Apache 上出现 API 404，通常是没有将 Web 根目录指向 `public`，或没有配置 URL 重写把请求交给 `index.php`。

## 一、目录结构要点
- Web 根目录必须指向 backend/public
- 公开资源（上传文件、静态资源）也在 `public/` 下
- 其他 PHP 源码不应暴露在 Web 根目录之外

## 二、Nginx 配置示例
```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/xisu/backend/public;
    index index.php index.html;

    # 访问日志（可选）
    access_log /var/log/nginx/xisu.access.log;
    error_log  /var/log/nginx/xisu.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock; # 按你的 PHP-FPM 版本修改
        fastcgi_index index.php;
    }

    # 上传目录（可直接访问）
    location /uploads/ {
        try_files $uri =404;
    }

    # CORS（若需要可加）
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization, X-Requested-With' always;
}
```

要点：
- `root` 必须是 `backend/public`，不是项目根目录。
- `location /` 的 `try_files` 将非真实文件的请求重写到 `index.php`。
- `fastcgi_pass` 按你的环境替换为相应的 PHP-FPM 套接字或 127.0.0.1:9000。

## 三、Apache 配置示例
如果使用虚拟主机配置：
```apacheconf
<VirtualHost *:80>
    ServerName example.com
    DocumentRoot "/var/www/xisu/backend/public"

    <Directory "/var/www/xisu/backend/public">
        AllowOverride All
        Require all granted
        Options Indexes FollowSymLinks
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/xisu-error.log
    CustomLog ${APACHE_LOG_DIR}/xisu-access.log combined
</VirtualHost>
```

并确保 `backend/public/.htaccess` 已包含如下规则（仓库已提供）：
```apacheconf
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.php [L]
```

注意：启用 `mod_rewrite` 并允许 `.htaccess` 生效（`AllowOverride All`）。

## 四、常见 404 排查清单
1. Web 根目录未指向 `backend/public`
2. 未配置重写规则（Nginx `try_files` 或 Apache `.htaccess`）
3. PHP-FPM 未运行或 fastcgi_pass 路径错误，导致 `index.php` 没有被执行
4. 文件/目录权限不足（`public/` 与 `public/uploads/` 需要 Web 用户可读写）
5. 反向代理/子路径部署（例如 `/api` 前还有前缀），需要在 Nginx 里正确设置 `location /前缀/ {}` 与 `try_files`
6. CORS 阻断被浏览器当作失败（但这通常是控制台报 CORS，而不是 404）

## 五、内置路由与入口说明
- 服务入口：`public/index.php`
- 内置路由：`index.php` 内根据 `/api/...` 和 `/admin/...` 分派
- 也提供 `public/router.php` 以便 `php -S` 开发模式将所有请求转发至 `index.php`

部署完成后，访问：
- 健康检查: `http://example.com/`（应返回 JSON: {"message":"校园小程序后端服务运行中"}）
- 示例 API: `http://example.com/api/announcement/list`

如仍遇到 404，请提供你的 Nginx/Apache 片段与实际访问的 URL，我将按你的环境逐条核对。
