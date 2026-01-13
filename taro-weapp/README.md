# 知外助手 - 微信小程序版

基于 Taro 4.x + React 18 开发的校园服务微信小程序。

## 项目结构

```
taro-weapp/
├── config/                 # Taro 配置
│   └── index.ts
├── src/
│   ├── assets/            # 静态资源
│   │   ├── icons/         # TabBar 图标
│   │   └── iconfont.scss  # 图标字体
│   ├── pages/             # 页面
│   │   ├── login/         # 登录页
│   │   ├── home/          # 首页（课程表）
│   │   ├── apps/          # 应用中心
│   │   ├── profile/       # 个人中心
│   │   ├── grades/        # 成绩查询
│   │   ├── exams/         # 考试安排
│   │   ├── bus/           # 校车时刻
│   │   ├── evaluation/    # 评教系统
│   │   └── ai-chat/       # AI 助手
│   ├── types/             # 类型定义
│   ├── app.config.ts      # 小程序配置
│   ├── app.scss           # 全局样式
│   └── app.tsx            # 入口文件
├── project.config.json    # 微信开发者工具配置
├── package.json
└── tsconfig.json
```

## 开发指南

### 1. 安装依赖

```bash
cd taro-weapp
npm install
```

### 2. 开发模式

```bash
npm run dev:weapp
```

### 3. 生产构建

```bash
npm run build:weapp
```

### 4. 在微信开发者工具中预览

1. 打开微信开发者工具
2. 导入项目，选择 `taro-weapp` 目录
3. 等待编译完成后即可预览

## 配置说明

### TabBar 图标

请在 `src/assets/icons/` 目录下放置以下图标文件：

- `home.png` / `home-active.png`
- `apps.png` / `apps-active.png`
- `profile.png` / `profile-active.png`

建议尺寸：81x81 像素

### 小程序 AppID

在 `project.config.json` 中修改 `appid` 为你的小程序 AppID：

```json
{
  "appid": "你的小程序AppID"
}
```

## 功能模块

- ✅ 登录页面
- ✅ 课程表（首页）
- ✅ 应用中心
- ✅ 个人中心
- ✅ 成绩查询
- ✅ 考试安排
- ✅ 校车时刻
- ✅ 评教系统
- ✅ AI 助手（本地模拟）

## 注意事项

1. AI 助手功能在小程序中使用本地模拟响应，如需接入真实 AI，请配置云函数或后端 API
2. 图标使用 emoji 作为临时替代，建议使用 iconfont.cn 生成自定义图标字体
3. 首次运行需要在微信开发者工具中信任项目

## 技术栈

- Taro 4.0.9
- React 18
- TypeScript
- Sass
