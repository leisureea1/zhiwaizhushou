# 校园小程序后台管理系统运行说明

## 环境要求

- PHP 7.4 或更高版本
- MySQL 5.7 或更高版本
- Composer（PHP依赖管理工具）
- Python 3.6 或更高版本（用于爬虫）

## 安装步骤

### 1. 安装PHP和相关扩展

在Mac上，推荐使用Homebrew安装PHP：

```bash
# 安装Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装PHP
brew install php
```

在Ubuntu/Debian上：

```bash
sudo apt update
sudo apt install php php-mysql php-mbstring php-xml php-curl
```

### 2. 安装Composer

Composer是PHP的依赖管理工具：

```bash
# 下载Composer安装脚本
curl -sS https://getcomposer.org/installer | php

# 全局安装Composer（可选）
mv composer.phar /usr/local/bin/composer
```

### 3. 安装PHP依赖

```bash
# 进入后端目录
cd backend

# 安装项目依赖
php ../composer.phar install
# 或者如果已全局安装Composer
composer install
```

### 4. 安装Python依赖（用于爬虫）

```bash
# 进入Python目录
cd python

# 安装依赖
pip install -r requirements.txt
```

## 数据库配置

1. 创建数据库：

```sql
CREATE DATABASE xisu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：

```bash
mysql -u your_username -p xisu < database/schema.sql
```

3. （可选）导入示例数据：

```bash
mysql -u your_username -p xisu < database/seeds.sql
```

4. 配置数据库连接：

编辑 `backend/config/database.php` 文件，设置正确的数据库连接信息：

```php
<?php
return [
    'host' => 'localhost',
    'dbname' => 'xisu',
    'username' => 'your_username',
    'password' => 'your_password',
    'charset' => 'utf8mb4'
];
```

## SMTP配置

编辑 `backend/config/smtp.php` 文件，配置邮件服务器信息：

```php
<?php
return [
    'host' => 'smtp.example.com',
    'username' => 'your_email@example.com',
    'password' => 'your_password',
    'port' => 587,
    'encryption' => 'tls'
];
```

## 启动服务

### 启动PHP开发服务器

```bash
# 进入公共目录
cd backend/public

# 启动PHP内置服务器
php -S localhost:8000
```

如果端口8000已被占用，可以使用其他端口：

```bash
php -S localhost:8001
```

### 生产环境部署

在生产环境中，推荐使用Apache或Nginx作为Web服务器。

#### Apache配置示例

确保启用mod_rewrite模块，并在虚拟主机配置中添加：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/project/backend/public

    <Directory /path/to/project/backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/project/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 定时任务

系统需要定期执行爬虫脚本来获取课程信息。可以通过cron设置定时任务：

```bash
# 编辑crontab
crontab -e

# 添加以下行以每小时执行一次
0 * * * * cd /path/to/project && python3 python/update_courses.py
```

## 目录权限

确保以下目录具有写权限：

- `backend/public/assets/uploads` (用于文件上传)
- `logs` (用于日志记录)

```bash
chmod -R 755 backend/public/assets/uploads
chmod -R 755 logs
```

## 故障排除

### Composer依赖问题

如果遇到Composer依赖问题，请尝试：

```bash
# 更新Composer
composer self-update

# 清除缓存
composer clear-cache

# 重新安装依赖
composer install
```

### PHP版本兼容性

如果遇到PHP版本兼容性问题，请确保使用PHP 7.4或更高版本：

```bash
# 检查PHP版本
php --version

# 如果需要更新PHP
brew upgrade php
```

### 数据库连接错误

如果遇到数据库连接错误，请检查：

1. 数据库服务是否正在运行
2. 数据库配置是否正确
3. 用户名和密码是否正确
4. 数据库用户是否具有适当的权限

### 权限问题

如果遇到权限问题，请检查：

1. Web服务器是否具有读取项目文件的权限
2. 上传目录是否具有写权限
3. 日志目录是否具有写权限