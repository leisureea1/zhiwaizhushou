# 宝塔面板部署指南

本文档介绍如何在宝塔面板上部署 XISU 后端服务，包括 NestJS 主后端和 FastAPI 教务服务。

---

## 目录

- [环境要求](#环境要求)
- [一、安装必要软件](#一安装必要软件)
- [二、部署 MySQL 数据库](#二部署-mysql-数据库)
- [三、部署 Redis 缓存](#三部署-redis-缓存)
- [四、部署 FastAPI 教务服务](#四部署-fastapi-教务服务)
- [五、部署 NestJS 后端](#五部署-nestjs-后端)
- [六、配置 Nginx 反向代理](#六配置-nginx-反向代理)
- [七、SSL 证书配置](#七ssl-证书配置)
- [八、常用运维命令](#八常用运维命令)
- [九、故障排查](#九故障排查)

---

## 环境要求

- 服务器：Linux（推荐 CentOS 7+ 或 Ubuntu 20.04+）
- 内存：≥ 2GB
- 宝塔面板：≥ 7.0
- Node.js：18.x LTS
- Python：3.9+
- MySQL：8.0+
- Redis：7+

---

## 一、安装必要软件

### 1.1 在宝塔软件商店安装

登录宝塔面板，在「软件商店」中安装：

- ✅ Nginx（推荐 1.24+）
- ✅ PM2 管理器
- ✅ Supervisor 管理器
- ✅ MySQL 8.0
- ✅ Redis 7
- ✅ Python 项目管理器（Python 3.9+）

### 1.2 安装 Node.js 18

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v  # 应显示 v18.x.x
npm -v
```

### 1.3 安装全局依赖

```bash
npm install -g pm2 prisma
```

---

## 二、部署 MySQL 数据库

### 2.1 创建数据库

在宝塔面板「数据库」中：

1. 点击「添加数据库」
2. 数据库名：`xisu`
3. 用户名：`xisu_user`
4. 密码：生成强密码并保存
5. 字符集：`utf8mb4`
6. 访问权限：本地服务器

### 2.2 记录数据库连接信息

```
DATABASE_URL=mysql://xisu_user:你的密码@127.0.0.1:3306/xisu
```

---

## 三、部署 Redis 缓存

### 3.1 配置 Redis

在宝塔「软件商店」→「Redis」→「设置」：

1. 绑定地址：`127.0.0.1`（仅本地访问）
2. 端口：`6379`
3. 可选：设置密码

### 3.2 启动 Redis

```bash
systemctl start redis
systemctl enable redis
```

---

## 四、部署 FastAPI 教务服务

### 4.1 上传代码

将 `python/` 目录上传到：`/www/wwwroot/jwxt-api`

```bash
# 或使用 Git 克隆
cd /www/wwwroot
git clone 你的仓库地址 xisu
mv xisu/python jwxt-api
```

### 4.2 创建虚拟环境并安装依赖

```bash
cd /www/wwwroot/jwxt-api

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖（使用国内镜像加速）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 4.3 配置 Supervisor

在宝塔「软件商店」→「Supervisor 管理器」→「添加守护进程」：

| 配置项 | 值 |
|--------|-----|
| 名称 | `jwxt-api` |
| 启动命令 | `/www/wwwroot/jwxt-api/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000` |
| 运行目录 | `/www/wwwroot/jwxt-api` |
| 启动用户 | `root` |

### 4.4 设置目录权限

```bash
chmod -R 755 /www/wwwroot/jwxt-api
chmod -R 777 /www/wwwroot/jwxt-api/data
```

### 4.5 验证服务

```bash
curl http://127.0.0.1:8000/docs
# 应返回 FastAPI Swagger 文档页面
```

---

## 五、部署 NestJS 后端

### 5.1 上传代码

将 `backend-nest/` 目录上传到：`/www/wwwroot/xisu-api`

```bash
cd /www/wwwroot
# 如果之前克隆过
mv xisu/backend-nest xisu-api
```

### 5.2 安装依赖

```bash
cd /www/wwwroot/xisu-api
npm ci --production=false
```

### 5.3 配置环境变量

创建 `/www/wwwroot/xisu-api/.env` 文件：

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_URL=mysql://xisu_user:你的数据库密码@127.0.0.1:3306/xisu

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 密钥（请生成随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# 教务服务
JWXT_SERVICE_URL=http://127.0.0.1:8000
JWXT_SERVICE_API_KEY=your-jwxt-api-key

# 邮件配置（用于验证码发送）
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your-email@qq.com
MAIL_PASS=your-email-auth-code
MAIL_FROM=your-email@qq.com
```

### 5.4 生成 Prisma Client 并运行迁移

```bash
cd /www/wwwroot/xisu-api

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy
```

### 5.5 构建项目

```bash
npm run build
```

### 5.6 使用 PM2 启动

```bash
# 启动服务
pm2 start dist/main.js --name xisu-api

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 5.7 验证服务

```bash
curl http://127.0.0.1:3000/api/v1/health
# 应返回健康检查响应
```

---

## 六、配置 Nginx 反向代理

### 6.1 创建网站

在宝塔「网站」中：

1. 点击「添加站点」
2. 域名：`api.your-domain.com`
3. PHP 版本：纯静态
4. 创建后点击「设置」

### 6.2 配置反向代理

在网站设置 →「配置文件」中，替换为：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL 证书（稍后配置）
    # ssl_certificate    /www/server/panel/vhost/cert/api.your-domain.com/fullchain.pem;
    # ssl_certificate_key    /www/server/panel/vhost/cert/api.your-domain.com/privkey.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 请求体大小限制
    client_max_body_size 50M;

    # NestJS API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/api/v1/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
    }

    # 访问日志
    access_log /www/wwwlogs/api.your-domain.com.log;
    error_log /www/wwwlogs/api.your-domain.com.error.log;
}
```

### 6.3 重载 Nginx

```bash
nginx -t && nginx -s reload
```

---

## 七、SSL 证书配置

### 7.1 申请证书

在宝塔网站设置 →「SSL」：

1. 选择「Let's Encrypt」
2. 勾选域名
3. 点击「申请」

### 7.2 强制 HTTPS

申请成功后，开启「强制 HTTPS」

---

## 八、常用运维命令

### 8.1 PM2 管理（NestJS）

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs xisu-api

# 重启服务
pm2 restart xisu-api

# 停止服务
pm2 stop xisu-api

# 监控
pm2 monit
```

### 8.2 Supervisor 管理（FastAPI）

```bash
# 查看状态
supervisorctl status jwxt-api

# 重启服务
supervisorctl restart jwxt-api

# 查看日志
tail -f /www/wwwlogs/jwxt-api.log
```

### 8.3 数据库操作

```bash
cd /www/wwwroot/xisu-api

# 查看迁移状态
npx prisma migrate status

# 运行新迁移
npx prisma migrate deploy

# 打开数据库 GUI
npx prisma studio
```

### 8.4 更新部署

```bash
cd /www/wwwroot/xisu-api

# 拉取最新代码
git pull

# 安装依赖
npm ci

# 运行迁移
npx prisma migrate deploy

# 重新构建
npm run build

# 重启服务
pm2 restart xisu-api
```

---

## 九、故障排查

### 9.1 服务无法启动

```bash
# 检查端口占用
lsof -i :3000
lsof -i :8000

# 检查日志
pm2 logs xisu-api --lines 100
tail -100 /www/wwwlogs/jwxt-api.log
```

### 9.2 数据库连接失败

```bash
# 测试数据库连接
cd /www/wwwroot/xisu-api
npx prisma db pull

# 检查 MySQL 状态
systemctl status mysql
```

### 9.3 Redis 连接失败

```bash
# 检查 Redis 状态
systemctl status redis
redis-cli ping
```

### 9.4 Nginx 502 错误

```bash
# 检查后端服务是否运行
pm2 status
curl http://127.0.0.1:3000/api/v1/health

# 检查 Nginx 错误日志
tail -100 /www/wwwlogs/api.your-domain.com.error.log
```

### 9.5 邮件发送失败

1. 检查邮箱 SMTP 配置是否正确
2. QQ 邮箱需要使用「授权码」而非登录密码
3. 检查防火墙是否放行 465/587 端口

---

## 附录：微信小程序服务器域名配置

在微信公众平台 →「开发」→「开发设置」→「服务器域名」中添加：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://api.your-domain.com` |
| uploadFile 合法域名 | `https://api.your-domain.com` |
| downloadFile 合法域名 | `https://api.your-domain.com` |

---

## 更新日志

- 2026-02-01：初始版本
