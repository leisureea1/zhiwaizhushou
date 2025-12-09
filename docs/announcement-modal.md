# 课程表页面公告弹窗功能

## 功能概述

在课程表页面添加了系统公告弹窗功能，当管理员发布置顶公告时，用户首次访问课程表页面会自动显示弹窗公告。

## 功能特性

1. **自动弹窗**: 用户首次访问课程表页面时自动显示置顶公告
2. **多条公告**: 支持多条公告依次显示，用户点击"下一条"查看
3. **已读记录**: 用户查看过的公告不会重复显示
4. **会话控制**: 每次小程序会话只检查一次公告，避免频繁弹窗
5. **登录验证**: 只有已登录用户才会显示公告

## 数据库变更

### 1. announcements 表新增字段
```sql
ALTER TABLE announcements ADD COLUMN is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶: 0-否 1-是';
```

### 2. 新增 announcement_views 表
```sql
CREATE TABLE announcement_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_uid INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_view (announcement_id, user_uid),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 后端 API

### 1. 获取置顶公告
- **接口**: `GET /api/announcement/pinned`
- **需要认证**: 是
- **功能**: 获取用户未查看过的置顶公告列表

### 2. 标记公告已查看
- **接口**: `POST /api/announcement/mark-viewed`
- **需要认证**: 是
- **参数**: `{ "announcement_id": number }`
- **功能**: 标记指定公告为已查看

### 3. 设置公告置顶状态 (管理员)
- **接口**: `POST /api/announcement/set-pinned`
- **需要认证**: 是 (管理员)
- **参数**: `{ "id": number, "is_pinned": boolean }`
- **功能**: 设置公告的置顶状态

## 前端实现

### 1. AnnouncementModal 组件
- 位置: `src/components/AnnouncementModal/`
- 功能: 公告弹窗显示组件
- 特性: 支持多条公告轮播、富文本内容、响应式设计

### 2. 课程表页面集成
- 文件: `src/pages/schedule/index.tsx`
- 逻辑: 在 `componentDidShow` 中检查并加载置顶公告
- 控制: 使用 localStorage 控制会话级别的显示逻辑

## 使用流程

### 管理员操作
1. 在后台管理系统创建公告
2. 调用设置置顶 API 将公告设为置顶状态
3. 用户访问课程表页面时会自动显示该公告

### 用户体验
1. 首次访问课程表页面时，如果有置顶公告会自动弹窗显示
2. 点击"下一条"查看多条公告（如果有）
3. 点击"我知道了"关闭弹窗并标记为已查看
4. 已查看过的公告不会重复显示
5. 同一会话期间不会重复检查公告

## 技术要点

### 1. 避免重复显示
- 使用数据库 `announcement_views` 表记录用户查看状态
- 使用 localStorage 控制会话级别的检查

### 2. 性能优化
- 只在首次访问时检查公告
- 异步加载，不阻塞页面渲染
- 错误处理，API 失败不影响页面正常使用

### 3. 用户体验
- 弹窗动画效果
- 支持富文本内容显示
- 移动端友好的响应式设计
- 渐进式多条公告展示

## 部署说明

1. **数据库迁移**: 执行 `database/announcement_pinned.sql`
2. **后端部署**: 确保新增的 API 路由生效
3. **前端部署**: 编译并部署小程序代码

## 测试建议

1. **创建测试公告**: 在后台创建一条公告并设为置顶
2. **登录测试**: 用测试账号登录小程序
3. **访问课程表**: 进入课程表页面，验证是否显示弹窗
4. **查看功能**: 点击"我知道了"，验证弹窗关闭
5. **重复访问**: 再次进入页面，验证不重复显示
6. **多条测试**: 创建多条置顶公告，测试轮播功能