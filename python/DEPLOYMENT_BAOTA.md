# 宝塔面板部署 FastAPI 服务教程

## 概述

本文档详细介绍如何在宝塔面板（BT Panel）上部署教务系统 FastAPI 服务，确保服务稳定运行并开机自启。

## 前置要求

- 已安装宝塔 Linux 面板（或 Windows 版）
- 服务器系统：CentOS 7+、Ubuntu 18.04+、Debian 9+ 或 Windows Server
- Python 3.7+ 已安装
- 项目代码已上传到服务器

## 部署步骤

### 第一步：准备 Python 环境

#### 方法 1：使用宝塔面板安装 Python（推荐）

1. 登录宝塔面板
2. 进入 **软件商店**
3. 搜索 **Python 项目管理器**
4. 点击安装（如果已安装则跳过）

#### 方法 2：手动安装 Python

```bash
# CentOS/RHEL
sudo yum install python3 python3-pip -y

# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip -y
```

验证安装：
```bash
python3 --version
pip3 --version
```

### 第二步：上传项目文件

#### 方法 1：使用宝塔文件管理器

1. 登录宝塔面板
2. 点击 **文件** 菜单
3. 进入网站目录（建议创建独立目录）：
   ```
   /www/wwwroot/xisu/
   ```
4. 上传整个 `python` 目录（包含 `fastapi_app.py`、`crawler` 目录等）

#### 方法 2：使用 Git（推荐）

```bash
cd /www/wwwroot
git clone https://github.com/leisureea1/XISU.git xisu
cd xisu/python
```

### 第三步：安装 Python 依赖

```bash
cd /www/wwwroot/xisu/python

# 安装依赖
pip3 install -r requirements.txt

# 或者使用国内镜像加速
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

验证安装：
```bash
pip3 list | grep -E "fastapi|uvicorn"
```

应该看到：
```
fastapi           0.104.1
uvicorn          0.24.0
```

### 第四步：配置宝塔 Supervisor 管理器（推荐方法）

Supervisor 是进程管理工具，可以确保 FastAPI 服务常驻运行并自动重启。

#### 4.1 安装 Supervisor

1. 登录宝塔面板
2. 进入 **软件商店**
3. 搜索 **Supervisor 管理器**
4. 点击 **安装**

#### 4.2 添加守护进程

1. 安装完成后，点击 **设置**
2. 点击 **添加守护进程**
3. 填写以下信息：

**基本配置**：
- **名称**：`jwxt-fastapi`
- **启动用户**：`www`（或 `root`，但不建议）
- **运行目录**：`/www/wwwroot/xisu/python`
- **启动命令**：
  ```bash
  /usr/bin/python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000
  ```
  
  或者指定完整路径（更可靠）：
  ```bash
  /usr/local/bin/uvicorn fastapi_app:app --host 127.0.0.1 --port 8000 --workers 1
  ```

**高级配置**（可选）：
- **进程数量**：`1`
- **日志路径**：`/www/wwwroot/xisu/python/logs/fastapi.log`（需先创建 logs 目录）

**完整配置示例**：
```ini
[program:jwxt-fastapi]
command=/usr/bin/python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000 --workers 1
directory=/www/wwwroot/xisu/python
user=www
autostart=true
autorestart=true
startsecs=3
startretries=3
redirect_stderr=true
stdout_logfile=/www/wwwroot/xisu/python/logs/fastapi.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
```

4. 创建日志目录：
```bash
mkdir -p /www/wwwroot/xisu/python/logs
chown -R www:www /www/wwwroot/xisu/python/logs
```

5. 点击 **确定** 保存
6. 在进程列表中找到 `jwxt-fastapi`，点击 **启动**

#### 4.3 验证服务运行

```bash
# 检查进程
ps aux | grep uvicorn

# 检查端口
netstat -tlnp | grep 8000
# 或
ss -tlnp | grep 8000

# 测试 API
curl http://127.0.0.1:8000/docs
```

如果看到 HTML 响应，说明服务已成功启动！

#### 4.4 查看日志

在宝塔面板中：
1. 进入 **Supervisor 管理器**
2. 找到 `jwxt-fastapi` 进程
3. 点击 **日志** 按钮查看运行日志

或者使用命令行：
```bash
tail -f /www/wwwroot/xisu/python/logs/fastapi.log
```

### 第五步：配置 Nginx 反向代理（可选但推荐）

如果需要通过域名访问或添加 HTTPS，需要配置 Nginx。

#### 5.1 在宝塔面板添加网站

1. 点击 **网站** 菜单
2. 点击 **添加站点**
3. 填写域名（例如：`api.yourdomain.com`）
4. 其他设置保持默认
5. 点击 **提交**

#### 5.2 配置反向代理

1. 在网站列表中找到刚创建的站点
2. 点击 **设置**
3. 点击 **反向代理**
4. 点击 **添加反向代理**

**配置信息**：
- **代理名称**：`JWXT API`
- **目标 URL**：`http://127.0.0.1:8000`
- **发送域名**：`$host`
- **内容替换**：留空

**高级配置（点击配置文件）**：
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持（如果需要）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# API 文档路径（可选：限制访问）
location /docs {
    # 仅允许内网访问
    # allow 192.168.1.0/24;
    # deny all;
    
    proxy_pass http://127.0.0.1:8000/docs;
    proxy_set_header Host $host;
}

location /redoc {
    proxy_pass http://127.0.0.1:8000/redoc;
    proxy_set_header Host $host;
}
```

5. 保存配置并重启 Nginx

#### 5.3 配置 SSL 证书（推荐）

1. 在网站设置中，点击 **SSL**
2. 选择 **Let's Encrypt** 免费证书
3. 填写邮箱地址
4. 点击 **申请**
5. 申请成功后，开启 **强制 HTTPS**

### 第六步：更新 PHP 配置

修改 `JwxtApiService.php` 中的 API 地址：

```php
public function __construct() {
    require_once dirname(__DIR__) . '/Utils/Logger.php';
    
    // 根据实际部署情况选择：
    
    // 方式 1：本地访问（FastAPI 和 PHP 在同一服务器）
    $this->apiBaseUrl = 'http://127.0.0.1:8000';
    
    // 方式 2：通过域名访问（配置了 Nginx 反向代理）
    // $this->apiBaseUrl = 'http://api.yourdomain.com';
    
    // 方式 3：HTTPS 访问（配置了 SSL 证书）
    // $this->apiBaseUrl = 'https://api.yourdomain.com';
    
    if (class_exists('Logger')) {
        Logger::log('JwxtApiService.init', [
            'apiBaseUrl' => $this->apiBaseUrl,
        ]);
    }
}
```

### 第七步：测试部署

#### 7.1 测试 FastAPI 服务

```bash
# 测试登录接口
curl "http://127.0.0.1:8000/login?username=YOUR_USERNAME&password=YOUR_PASSWORD"

# 测试课程接口
curl "http://127.0.0.1:8000/course?username=YOUR_USERNAME&password=YOUR_PASSWORD"

# 测试学期接口
curl "http://127.0.0.1:8000/semester?username=YOUR_USERNAME&password=YOUR_PASSWORD"
```

#### 7.2 访问 API 文档

打开浏览器访问：
- Swagger UI：`http://你的域名/docs` 或 `http://服务器IP:8000/docs`
- ReDoc：`http://你的域名/redoc` 或 `http://服务器IP:8000/redoc`

#### 7.3 测试 PHP 调用

创建测试文件 `/www/wwwroot/xisu/backend/test_fastapi.php`：

```php
<?php
require_once __DIR__ . '/app/Services/JwxtApiService.php';

$service = new JwxtApiService();

// 替换为测试账号
$username = 'YOUR_USERNAME';
$password = 'YOUR_PASSWORD';

echo "=== 测试获取学期列表 ===\n";
$result = $service->getSemesters($username, $password);
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n\n";

echo "=== 测试获取用户信息 ===\n";
$result = $service->getUserInfo($username, $password);
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n\n";
?>
```

运行测试：
```bash
cd /www/wwwroot/xisu/backend
php test_fastapi.php
```

## 常见问题和解决方案

### 1. 服务无法启动

**检查步骤**：

```bash
# 查看 Supervisor 日志
tail -f /www/wwwroot/xisu/python/logs/fastapi.log

# 检查 Python 路径
which python3
which uvicorn

# 手动测试启动
cd /www/wwwroot/xisu/python
python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000
```

**常见错误**：

#### 错误 1：`ModuleNotFoundError: No module named 'fastapi'`
```bash
# 确认 pip 安装路径
pip3 show fastapi

# 重新安装
pip3 install --upgrade fastapi uvicorn
```

#### 错误 2：`Address already in use`
```bash
# 查找占用端口的进程
lsof -i :8000
# 或
netstat -tlnp | grep 8000

# 杀死进程
kill -9 <PID>

# 或者更换端口
# 修改启动命令中的 --port 参数
```

#### 错误 3：`Permission denied`
```bash
# 修改目录权限
chown -R www:www /www/wwwroot/xisu/python
chmod -R 755 /www/wwwroot/xisu/python

# 或使用 root 用户运行（不推荐）
# 在 Supervisor 配置中修改 user=root
```

### 2. 服务频繁重启

查看日志找出原因：
```bash
tail -100 /www/wwwroot/xisu/python/logs/fastapi.log
```

可能原因：
- 代码有错误导致启动失败
- 依赖包版本不兼容
- 端口被占用
- 内存不足

### 3. PHP 无法连接到 FastAPI

**检查步骤**：

```bash
# 1. 确认 FastAPI 服务运行中
ps aux | grep uvicorn

# 2. 确认端口监听
netstat -tlnp | grep 8000

# 3. 测试本地连接
curl http://127.0.0.1:8000/docs

# 4. 检查防火墙
# 如果 PHP 和 FastAPI 在同一服务器，通常不需要开放端口
# 如果在不同服务器，需要开放 8000 端口

# 宝塔面板开放端口：
# 安全 → 放行端口 → 添加 8000 端口
```

**PHP cURL 错误排查**：

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/docs');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$error = curl_error($ch);
$info = curl_getinfo($ch);

echo "Error: " . $error . "\n";
echo "HTTP Code: " . $info['http_code'] . "\n";
echo "Response: " . substr($response, 0, 200) . "\n";

curl_close($ch);
?>
```

### 4. 服务占用内存过高

```bash
# 查看进程内存使用
ps aux | grep uvicorn

# 限制 workers 数量（在 Supervisor 配置中）
# --workers 1  # 单进程即可

# 定期重启服务（可选）
# 在宝塔面板添加计划任务：
# 每天凌晨 3 点重启
# 0 3 * * * supervisorctl restart jwxt-fastapi
```

### 5. 日志文件过大

```bash
# 查看日志大小
du -h /www/wwwroot/xisu/python/logs/fastapi.log

# 清理日志（谨慎操作）
> /www/wwwroot/xisu/python/logs/fastapi.log

# 或者使用日志轮转（已在 Supervisor 配置中设置）
# stdout_logfile_maxbytes=50MB
# stdout_logfile_backups=10
```

## 性能优化建议

### 1. 使用进程池（可选）

对于高并发场景，可以增加 workers：

```bash
# Supervisor 配置中修改启动命令
command=/usr/bin/python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000 --workers 2
```

**注意**：增加 workers 会增加内存消耗，且每个 worker 需要独立登录。

### 2. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
location / {
    # ... 其他配置 ...
    
    # 启用 Gzip
    gzip on;
    gzip_types application/json text/plain text/css application/javascript;
    gzip_min_length 1000;
}
```

### 3. 添加缓存

对于不常变化的数据（如学期列表），可以添加缓存：

在 Nginx 中：
```nginx
# 缓存学期列表 1 小时
location /semester {
    proxy_pass http://127.0.0.1:8000/semester;
    proxy_cache_valid 200 1h;
}
```

### 4. 监控和告警

在宝塔面板中：
1. 安装 **监控报警** 插件
2. 配置进程监控，监控 `uvicorn` 进程
3. 设置告警规则（进程停止、CPU/内存过高等）

## 安全加固

### 1. 限制访问来源

如果 FastAPI 仅供本地 PHP 调用，建议只监听本地：

```bash
# Supervisor 配置中使用 127.0.0.1
--host 127.0.0.1
```

### 2. 添加 API 认证（可选）

修改 `fastapi_app.py` 添加 API Key 认证：

```python
from fastapi import FastAPI, Query, Header, HTTPException

API_KEY = "your-secret-api-key-here"

async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return x_api_key

@app.get("/course", dependencies=[Depends(verify_api_key)])
async def course(...):
    # ... 原有代码 ...
```

PHP 调用时添加 Header：

```php
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: your-secret-api-key-here'
]);
```

### 3. 限制请求频率

在 Nginx 中添加限流：

```nginx
# 在 http 块中定义限流区域
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 在 location 块中应用
location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ... 其他配置 ...
}
```

### 4. 隐藏 API 文档

在生产环境中，建议限制或关闭 API 文档访问：

```nginx
# 只允许特定 IP 访问文档
location /docs {
    allow 192.168.1.0/24;  # 允许内网
    allow YOUR_IP;          # 允许你的 IP
    deny all;               # 拒绝其他
    
    proxy_pass http://127.0.0.1:8000/docs;
}
```

## 维护和更新

### 更新代码

```bash
cd /www/wwwroot/xisu
git pull origin main

# 重启服务
supervisorctl restart jwxt-fastapi

# 或在宝塔面板中手动重启
```

### 备份

在宝塔面板中设置自动备份：
1. 点击 **计划任务**
2. 添加 **备份目录** 任务
3. 选择 `/www/wwwroot/xisu/python`
4. 设置每周备份一次

### 查看服务状态

```bash
# 使用 supervisorctl
supervisorctl status jwxt-fastapi

# 或在宝塔面板 Supervisor 管理器中查看
```

## 总结

完成以上步骤后，你的 FastAPI 服务将：

✅ 自动启动（开机启动）  
✅ 自动重启（崩溃后自动恢复）  
✅ 日志记录（方便排查问题）  
✅ 性能优化（Nginx 反向代理、Gzip 压缩）  
✅ 安全加固（限制访问、HTTPS）  

性能提升：
- **响应时间**：从 1000-1500ms 降低到 50-200ms
- **并发能力**：从单次请求到支持多请求并发
- **稳定性**：7x24 小时稳定运行

## 相关链接

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Uvicorn 文档](https://www.uvicorn.org/)
- [Supervisor 文档](http://supervisord.org/)
- [宝塔面板官网](https://www.bt.cn/)

## 技术支持

如遇到问题，请：
1. 查看本文档的"常见问题"部分
2. 检查 FastAPI 日志：`/www/wwwroot/xisu/python/logs/fastapi.log`
3. 查看 Supervisor 日志
4. 查看 Nginx 错误日志：`/www/wwwlogs/error.log`

---

**祝部署顺利！** 🎉
