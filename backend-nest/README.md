# XISU Backend (NestJS)

西外校园服务 NestJS 后端 —— 与 FastAPI 教务微服务协作

## 技术栈

- **运行时**: Node.js 18+
- **框架**: NestJS 10
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT (Access Token + Refresh Token)
- **文档**: Swagger/OpenAPI

## 项目结构

```
backend-nest/
├── src/
│   ├── common/                 # 通用模块
│   │   ├── decorators/         # 自定义装饰器
│   │   ├── dto/                # 通用 DTO
│   │   ├── filters/            # 异常过滤器
│   │   ├── guards/             # 守卫
│   │   └── interceptors/       # 拦截器
│   ├── config/                 # 配置
│   ├── modules/                # 业务模块
│   │   ├── admin/              # 管理后台
│   │   ├── announcements/      # 公告模块
│   │   ├── auth/               # 认证模块
│   │   ├── jwxt/               # 教务系统对接
│   │   └── users/              # 用户模块
│   ├── prisma/                 # Prisma 服务
│   ├── services/               # 通用服务
│   ├── app.module.ts           # 根模块
│   └── main.ts                 # 入口文件
├── prisma/
│   └── schema.prisma           # 数据库模型
├── test/                       # 测试
├── docker-compose.yml          # Docker 生产配置
├── docker-compose.dev.yml      # Docker 开发配置
└── Dockerfile                  # Docker 镜像
```

## 快速开始

### 1. 安装依赖

```bash
cd backend-nest
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库、Redis、JWT 等
```

### 3. 启动开发数据库

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. 数据库迁移

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行迁移
npm run prisma:migrate
```

### 5. 启动开发服务器

```bash
npm run start:dev
```

服务将在 `http://localhost:3000` 运行。

## API 文档

启动服务后访问 `http://localhost:3000/docs` 查看 Swagger API 文档。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run start:dev` | 开发模式启动（热重载） |
| `npm run start:debug` | 调试模式启动 |
| `npm run build` | 构建生产版本 |
| `npm run start:prod` | 生产模式启动 |
| `npm run test` | 运行单元测试 |
| `npm run test:e2e` | 运行端到端测试 |
| `npm run test:cov` | 运行测试并生成覆盖率报告 |
| `npm run lint` | 运行代码检查 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 运行数据库迁移 |
| `npm run prisma:studio` | 打开 Prisma Studio |

## API 端点

### 认证 (Auth)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/send-code` | 发送邮箱验证码 |
| POST | `/api/v1/auth/verify-code` | 验证邮箱验证码 |
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新令牌 |
| POST | `/api/v1/auth/logout` | 用户登出 |
| POST | `/api/v1/auth/change-password` | 修改密码 |

### 用户 (Users)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/users/me` | 获取当前用户信息 |
| GET | `/api/v1/users` | 获取用户列表（管理员） |
| GET | `/api/v1/users/:id` | 获取用户详情 |
| PUT | `/api/v1/users/:id` | 更新用户资料 |
| POST | `/api/v1/users/:id/avatar` | 更新用户头像 |
| DELETE | `/api/v1/users/:id` | 删除用户（超管） |

### 公告 (Announcements)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/announcements` | 获取公告列表 |
| GET | `/api/v1/announcements/:id` | 获取公告详情 |
| POST | `/api/v1/announcements` | 创建公告（管理员） |
| PUT | `/api/v1/announcements/:id` | 更新公告（管理员） |
| DELETE | `/api/v1/announcements/:id` | 删除公告（管理员） |
| POST | `/api/v1/announcements/:id/publish` | 发布公告 |
| POST | `/api/v1/announcements/:id/pin` | 置顶公告 |

### 教务系统 (JWXT)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/jwxt/course` | 获取课表 |
| GET | `/api/v1/jwxt/grade` | 获取成绩 |
| GET | `/api/v1/jwxt/exam` | 获取考试安排 |
| GET | `/api/v1/jwxt/semester` | 获取学期列表 |
| POST | `/api/v1/jwxt/bind` | 绑定教务系统账号 |
| POST | `/api/v1/jwxt/evaluation/auto` | 一键评教 |

### 管理后台 (Admin)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/admin/dashboard/stats` | 仪表盘统计 |
| GET | `/api/v1/admin/system-logs` | 系统日志查询 |
| GET | `/api/v1/admin/features` | 功能开关列表 |
| POST | `/api/v1/admin/features/:name` | 更新功能开关 |

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t xisu-backend .

# 运行容器
docker-compose up -d
```

### 生产环境检查清单

- [ ] 配置安全的 JWT_SECRET 和 JWT_REFRESH_SECRET
- [ ] 配置强密码的数据库连接
- [ ] 配置 Redis 密码
- [ ] 配置正确的 CORS 域名
- [ ] 启用 HTTPS
- [ ] 配置日志收集
- [ ] 配置监控告警

## 与 FastAPI 教务服务的集成

NestJS 后端通过 `JwxtClientService` 调用 FastAPI 教务服务（位于 `python/` 目录）。

教务服务负责：
- 教务系统登录/会话管理
- 课表、成绩、考试数据抓取
- 评教功能

NestJS 后端负责：
- 用户认证和权限管理
- 业务逻辑处理
- 数据持久化
- API 网关

## 许可证

MIT
