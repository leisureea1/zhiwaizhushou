# 西安外国语大学小程序

基于 Taro 框架开发的西安外国语大学教务系统小程序，支持课程表查询、成绩查询等功能。

## 项目特点

- 🎯 **多端支持**: 基于 Taro 框架，一套代码支持微信小程序、支付宝小程序、H5等多个平台
- 📚 **课程表功能**: 完整的课程表展示，支持周视图、时间段显示
- 📊 **成绩查询**: 成绩查询和统计分析功能
- 🔐 **安全登录**: 支持教务系统账号登录
- 📱 **响应式设计**: 适配不同尺寸的移动设备
- 🎨 **现代UI**: 采用现代化的界面设计

## 技术栈

- **框架**: Taro 4.x + React 18
- **语言**: TypeScript
- **样式**: Sass
- **构建工具**: Webpack 5
- **状态管理**: React Hooks
- **网络请求**: Taro.request

## 项目结构

```
taro-miniprogram/
├── config/                 # 配置文件
│   ├── index.js            # 主配置
│   ├── dev.js              # 开发环境配置
│   └── prod.js             # 生产环境配置
├── src/                    # 源代码
│   ├── app.tsx             # 应用入口
│   ├── app.config.ts       # 应用配置
│   ├── app.scss            # 全局样式
│   ├── pages/              # 页面
│   │   ├── index/          # 应用中心页
│   │   ├── schedule/       # 课程表页
│   │   └── profile/        # 个人中心页
│   ├── components/         # 组件
│   ├── services/           # 服务层
│   ├── utils/              # 工具函数
│   ├── types/              # 类型定义
│   └── assets/             # 静态资源
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript配置
└── project.config.json     # 小程序项目配置
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
cd taro-miniprogram
npm install
```

### 开发调试

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5

# 支付宝小程序
npm run dev:alipay
```

### 构建发布

```bash
# 微信小程序
npm run build:weapp

# H5
npm run build:h5

# 支付宝小程序
npm run build:alipay
```

## 功能模块

### 1. 课程表模块
- ✅ 周视图课程表
- ✅ 时间段显示 
- ✅ 课程详情查看
- ✅ 周次切换
- ✅ 刷新功能

### 2. 应用中心
- ✅ 应用网格布局
- ✅ 快捷入口
- ✅ 功能导航

### 3. 个人中心
- ✅ 用户登录/退出
- ✅ 个人信息显示
- ✅ 功能菜单

### 4. 待开发功能
- ⏳ 成绩查询详情页
- ⏳ 教务通知
- ⏳ 考试安排
- ⏳ 校园卡查询
- ⏳ 图书馆功能

## 配置说明

### 小程序配置

在 `project.config.json` 中配置小程序基本信息：

```json
{
  "appid": "your-mini-program-appid",
  "projectname": "微信小程序课程表"
}
```

### API配置

在 `src/services/api.ts` 中配置API地址：

```typescript
const BASE_URL = 'https://jwxt.xisu.edu.cn'
```

## 部署说明

### 微信小程序

1. 安装微信开发者工具
2. 运行 `npm run build:weapp`
3. 打开微信开发者工具导入 `dist` 目录
4. 配置AppID并上传发布

### H5版本

1. 运行 `npm run build:h5`
2. 将 `dist` 目录部署到Web服务器

## 从React项目迁移的主要变化

### 1. 组件替换
- `div` → `View`
- `span/p` → `Text`
- `img` → `Image`
- `input` → `Input`
- `button` → `Button`

### 2. 事件处理
- `onClick` → `onClick`（保持一致）
- `onChange` → `onInput`
- 新增小程序特有事件

### 3. 样式适配
- 使用 `rpx` 响应式单位
- 移除不支持的CSS属性
- 适配小程序样式规范

### 4. 路由导航
- 使用 `Taro.navigateTo` 等API
- 配置 `app.config.ts` 中的页面路由

### 5. 状态管理
- 移除 Radix UI 依赖
- 使用原生小程序组件
- 简化状态管理逻辑

## 开发建议

1. **调试工具**: 推荐使用微信开发者工具进行调试
2. **真机测试**: 及时在真机上测试功能
3. **性能优化**: 注意包大小限制，按需引入
4. **兼容性**: 注意不同平台的API差异

## 常见问题

### Q: 如何处理网络请求？
A: 使用 `Taro.request` API，已封装在 `src/services/api.ts` 中。

### Q: 如何处理路由跳转？
A: 使用 `Taro.navigateTo`、`Taro.switchTab` 等API。

### Q: 样式不生效怎么办？
A: 检查是否使用了小程序不支持的CSS属性，建议使用 `rpx` 单位。

### Q: 如何调试？
A: 使用微信开发者工具的调试面板，或使用 `console.log` 输出调试信息。

## 更新日志

### v1.0.0 (2024-09-29)
- ✅ 完成从React应用到Taro小程序的迁移
- ✅ 实现课程表、应用中心、个人中心三个主要页面
- ✅ 完成基础组件和服务层封装
- ✅ 适配小程序样式规范

## 联系我们

如有问题或建议，请联系开发团队。
