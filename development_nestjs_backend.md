# NestJS 后端 开发文档（与现有 FastAPI 协作）

说明：本文件为用 NestJS 重写后端时的开发文档。FastAPI（位于 `python/`）保留为教务（JWXT）抓取与处理微服务，NestJS 负责主业务逻辑、管理后台 API、与前端的对接。

---

**目录**
- 概览与目标
- 技术栈与主要依赖
- 项目结构建议
- 模块映射（从旧 PHP 控制器到 NestJS 模块）
- 认证与权限设计
- 与 FastAPI 的调用模式（安全、重试、缓存）
- 数据库与迁移（Prisma 示例）
- 敏感数据处理策略
- 开发 / 运行 / 测试 示例命令
- 部署、CI/CD 与运维建议
- 环境变量清单
- 上线前检查清单

---

## 一、概览与目标

- 用 NestJS + TypeScript ，提供干净、模块化、可测试且可扩展的服务。保留现有 `python/` FastAPI 服务（教务抓取/会话/速率控制），NestJS 通过受控的内部接口调用 FastAPI 获取教务数据。
- 输出目标：清晰模块边界、OpenAPI 文档、测试覆盖、容器化部署、敏感数据保护、服务间认证。版本化 API：`/api/v1/...`。

---

## 二、技术栈与主要依赖（推荐）



## 三、项目结构建议

推荐把 NestJS 服务放在仓库 `backend-nest/` 目录：

backend-nest/
│  ├─ common/
│  │  ├─ interceptors/
│  │  └─ filters/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ announcements/
│  │  ├─ flea-market/
│  │  ├─ lost-found/
│  │  ├─ admin/
│  │  └─ system-log/
│  ├─ services/
│  │  └─ jwxt-client.service.ts   # 调用 FastAPI 的封装
│  ├─ prisma/
│  │  └─ schema.prisma
│  └─ config/
├─ test/
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
└─ README.md
```

---



---

## 一、推荐技术栈

- 运行时：Node.js 18+（LTS）
- 语言：TypeScript
- 框架：NestJS（模块化、依赖注入、内置 Swagger 支持）
- ORM：Prisma（推荐）或 TypeORM
- 数据库：PostgreSQL
- 缓存/会话：Redis
- HTTP 客户端：axios 或 got（统一封装，支持超时与重试）
- 认证：JWT（Access + Refresh），密码哈希使用 bcrypt 或 Argon2
- 后台任务/队列：Bull（Redis）或 RabbitMQ
- 文件存储：本地目录
- 日志与监控：winston / pino + Sentry / Prometheus / Grafana
- 测试：Jest（单元） + SuperTest（e2e）


---

## 二、后端功能列表（按模块）

以下为完整后端功能清单，按模块分组，描述每个模块应包含的 HTTP 接口与关键行为。

- **认证（Auth）**
  - 用户注册（POST /api/v1/auth/register）
  - 用户登录（POST /api/v1/auth/login）返回 access_token 与 refresh_token
  - 刷新令牌（POST /api/v1/auth/refresh）
  - 注销（POST /api/v1/auth/logout）
  - 密码哈希与重置流程（请求重置、重置确认）

- **用户（Users）**
  - 获取当前用户信息（GET /api/v1/users/me）
  - 查看/编辑用户资料（GET/PUT /api/v1/users/:id）
  - 修改密码（POST /api/v1/users/:id/change-password）
  - 更新头像（POST /api/v1/users/:id/avatar）
  - 用户列表（分页）与管理员操作（GET /api/v1/users）

- **公告（Announcements）**
  - 列表（GET /api/v1/announcements）支持分页、筛选
  - 详情（GET /api/v1/announcements/:id）
  - 创建（POST /api/v1/announcements）——管理员权限
  - 更新（PUT /api/v1/announcements/:id）——管理员权限
  - 删除（DELETE /api/v1/announcements/:id）——管理员权限
  - 标记已读/标记弹窗（POST /api/v1/announcements/:id/mark-viewed）
  - 置顶/取消置顶（POST /api/v1/announcements/:id/pin）
  - 图片/附件管理（上传、删除、签名 URL）





- **管理员（Admin）/后台**
  - 仪表盘统计（GET /api/v1/admin/dashboard/stats）
  - 待处理项（GET /api/v1/admin/dashboard/pending-items）
  - 管理用户角色与删除（POST /api/v1/admin/users/:id/role`, `DELETE /api/v1/admin/users/:id`）
  - 功能开关管理（GET/POST /api/v1/admin/features）
  - SMTP 与通知配置界面 API（GET/POST /api/v1/admin/smtp）

- **系统日志与审计（System Log）**
  - 写入操作日志（内部服务）
  - 日志查询（GET /api/v1/admin/system-logs）支持筛选与分页
  - 操作类型与统计（GET /api/v1/admin/system-logs/action-types`, `GET /api/v1/admin/system-logs/stats`）

- **通知（Notifications）**
  - 获取/更新通知设置（GET/POST /api/v1/notifications/settings）
  - 测试推送（POST /api/v1/notifications/test）触发外部推送（Bark/邮件/其它）

- **功能开关（Feature Flags）**
  - 读取功能配置（GET /api/v1/feature/settings）
  - 检查单项功能状态（GET /api/v1/feature/check?name=...）
  - 管理员更新/切换（POST /api/v1/admin/features/*）

- **文件与媒体管理**
  - 上传（POST /api/v1/files/upload）返回签名 URL 或资源 ID
  - 删除（DELETE /api/v1/files/:id）受权限控制
  - 访问控制与签名 URL 生成（GET /api/v1/files/:id/signed-url）

- **教务/课程/成绩/考试/评教（教务相关模块）**
  - 课程（GET /api/v1/jwxt/course）
  - 成绩（GET /api/v1/jwxt/grade）
  - 学期（GET /api/v1/jwxt/semester）
  - 考试（GET /api/v1/jwxt/exam` 和 `/exam/debug`）
  - 评教（GET /api/v1/jwxt/evaluation/*）
  - 服务间认证与缓存（内部实现细节）

- **评教（Evaluation）**
  - 获取待评列表（GET /api/v1/evaluation/pending）
  - 提交评教（POST /api/v1/evaluation/submit）
  - 一键评教/批量评教（POST /api/v1/evaluation/auto）

- **缓存/会话/管理接口**
  - 缓存统计（GET /api/v1/cache/stats）
  - 缓存内容与清理（GET /api/v1/cache/info`, `POST /api/v1/cache/clear`）

---

## 三、备注与开发约定

- 所有对外 API 版本化（例如 `/api/v1/`），并生成 OpenAPI 文档供前端/客户端使用。
- 敏感字段（如教务密码）不在接口日志中输出，不以明文长期存储。
- 管理接口应有细化的 RBAC 权限控制与 CSRF 防护（若使用 Cookie）。

---


---
