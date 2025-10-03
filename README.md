# 校园小程序后台管理系统

这是一个为校园小程序设计的后台管理系统，包含后端API、数据库设计和后台管理界面。

## 功能特性

- 用户管理（注册、登录、找回密码）
- 课程信息获取（通过Python爬虫）
- 公告管理
- 跳蚤市场
- 失物招领
- SMTP邮件配置
- 系统日志

## 技术栈

- 后端：PHP
- 前端：Bootstrap, HTML, CSS, JavaScript
- 数据库：MySQL
- 爬虫：Python (BeautifulSoup, Requests)
- 依赖管理：Composer (PHP), pip (Python)

## 问题解决

如果您遇到了类似以下错误：

```
Warning: require_once(/Users/apple/Desktop/xisu/backend/vendor/autoload.php): Failed to open stream: No such file or directory
Fatal error: Uncaught Error: Failed opening required '/Users/apple/Desktop/xisu/backend/vendor/autoload.php'
```

请参考我们提供的[问题解决指南](ISSUE_RESOLUTION.md)。

## 功能模块

### 1. 用户模块
- 注册、登录、找回密码
- 邮件验证
- 权限管理（普通用户/管理员）

### 2. 课程模块
- 调用Python爬虫获取课表和成绩
- 数据存储和查询

### 3. 公告模块
- 发布、编辑、删除公告
- API接口提供公告数据

### 4. 跳蚤市场模块
- 商品发布、编辑、删除
- 后台审核机制

### 5. 失物招领模块
- 信息发布、状态管理
- 后台审核

### 6. SMTP邮件配置模块
- 后台配置SMTP参数
- 自动使用配置发送邮件

### 7. 后台管理模块
- 用户、课程、公告管理
- 跳蚤市场、失物招领审核
- SMTP配置管理
- 系统日志查看

## 数据库设计

数据库表结构定义在 `/database/schema.sql` 文件中，包含以下表：
- 用户表 (users)
- 课程表 (courses)
- 成绩表 (grades)
- 公告表 (announcements)
- 跳蚤市场表 (flea_market)
- 失物招领表 (lost_found)
- SMTP配置表 (smtp_config)
- 日志表 (system_logs)

## API接口

所有API接口均返回JSON格式数据，详细接口说明请参考 `/docs` 目录下的文档。

## 安装和部署

详细安装和运行说明请参考 [RUNNING.md](RUNNING.md) 文件。

### 快速开始

1. 安装PHP依赖：
   ```bash
   # 进入后端目录
   cd backend
   
   # 安装Composer（如果尚未安装）
   curl -sS https://getcomposer.org/installer | php
   
   # 使用Composer安装依赖
   php ../composer.phar install
   ```

2. 启动开发服务器：
   ```bash
   # 进入公共目录
   cd backend/public
   
   # 启动PHP内置服务器
   php -S localhost:8001
   ```

3. 访问应用：
   - 前台页面: http://localhost:8001
   - 后台管理: http://localhost:8001/admin

1. 导入数据库结构：
   ```sql
   mysql -u username -p database_name < database/schema.sql
   ```

2. 插入示例数据（可选）：
   ```sql
   mysql -u username -p database_name < database/seeds.sql
   ```

3. 配置Web服务器，将 `/backend/public` 目录设为网站根目录

4. 安装PHP依赖（如果使用Composer）：
   ```bash
   cd backend
   composer install
   ```

5. 配置SMTP参数：
   更新 `smtp_config` 表中的配置信息

## 安全措施

- 小程序密码加密存储
- 教务系统密码明文存储（明确用途）
- API权限验证
- 后台管理权限控制

## 注意事项

1. 教务系统爬虫仅为示例，实际使用时需要根据目标教务系统调整爬虫逻辑
2. 邮件功能需要配置有效的SMTP服务器
3. 生产环境中应加强安全措施，如使用HTTPS、JWT令牌验证等