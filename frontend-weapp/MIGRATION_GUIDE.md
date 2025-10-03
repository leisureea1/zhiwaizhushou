# React 到 Taro 小程序迁移指南

本文档详细说明了如何将原有的 React 应用迁移到 Taro 小程序的过程。

## 迁移概览

### 原项目结构 (React + Vite)
```
front/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── SchedulePage.tsx
│   │   ├── AppsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── BottomNavigation.tsx
│   └── styles/
├── package.json
└── vite.config.ts
```

### 迁移后结构 (Taro)
```
taro-miniprogram/
├── src/
│   ├── app.tsx
│   ├── app.config.ts
│   ├── pages/
│   │   ├── schedule/index.tsx
│   │   ├── index/index.tsx
│   │   └── profile/index.tsx
│   ├── components/
│   ├── services/
│   └── utils/
├── config/
└── package.json
```

## 主要变化对比

### 1. 项目结构变化

| 原React应用 | Taro小程序 | 说明 |
|-------------|------------|------|
| `src/App.tsx` | `src/app.tsx` | 应用入口 |
| `src/main.tsx` | `src/app.config.ts` | 应用配置 |
| 单页面应用 | 多页面应用 | 页面路由机制 |
| `BottomNavigation` | `tabBar配置` | 底部导航 |

### 2. 组件API变化

| React组件 | Taro组件 | 说明 |
|-----------|----------|------|
| `<div>` | `<View>` | 容器组件 |
| `<span>`, `<p>` | `<Text>` | 文本组件 |
| `<img>` | `<Image>` | 图片组件 |
| `<input>` | `<Input>` | 输入组件 |
| `<button>` | `<Button>` | 按钮组件 |

### 3. 样式系统变化

| React样式 | Taro样式 | 说明 |
|-----------|----------|------|
| `px`, `rem`, `vh/vw` | `rpx` | 响应式单位 |
| CSS-in-JS | `.scss` 文件 | 样式文件 |
| Tailwind CSS | 自定义样式类 | 工具类 |

### 4. 路由系统变化

| React Router | Taro路由 | 说明 |
|--------------|----------|------|
| `useState` 切换页面 | 页面导航API | 真实页面跳转 |
| `<Routes>` | `app.config.ts` | 路由配置 |
| 状态路由 | 物理页面 | 页面机制 |

## 具体迁移步骤

### 第一步：项目初始化
```bash
# 创建Taro项目
npx @tarojs/cli init taro-miniprogram

# 配置TypeScript和Sass
```

### 第二步：页面拆分
将原来的单页面应用拆分为多个页面：

1. **SchedulePage** → `pages/schedule/index.tsx`
2. **AppsPage** → `pages/index/index.tsx`  
3. **LoginPage** → `pages/profile/index.tsx`

### 第三步：组件迁移
替换React DOM组件为Taro组件：

```typescript
// 原React代码
function SchedulePage() {
  return (
    <div className="schedule-page">
      <h1>课程表</h1>
      <div className="courses">
        {courses.map(course => (
          <div key={course.id} onClick={() => showDetail(course)}>
            <span>{course.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 迁移后Taro代码
export default class SchedulePage extends Component {
  render() {
    return (
      <View className="schedule-page">
        <Text className="title">课程表</Text>
        <View className="courses">
          {courses.map(course => (
            <View key={course.id} onClick={() => this.showDetail(course)}>
              <Text>{course.name}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }
}
```

### 第四步：样式适配
转换CSS样式为小程序兼容格式：

```scss
// 原React样式
.schedule-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.course-item {
  padding: 16px;
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

// 迁移后Taro样式
.schedule-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 40rpx;
}

.course-item {
  padding: 32rpx;
  margin: 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
}
```

### 第五步：事件处理适配
```typescript
// 原React事件
const handleClick = (e) => {
  e.preventDefault();
  // 处理逻辑
}

<button onClick={handleClick}>点击</button>

// Taro事件
handleClick = (e) => {
  // 处理逻辑  
}

<Button onClick={this.handleClick}>点击</Button>
```

### 第六步：API调用适配
```typescript
// 原React (fetch/axios)
const fetchData = async () => {
  const response = await fetch('/api/courses');
  const data = await response.json();
  return data;
}

// Taro
const fetchData = async () => {
  const response = await Taro.request({
    url: 'https://api.example.com/courses',
    method: 'GET'
  });
  return response.data;
}
```

## 移除的依赖项

### Radix UI组件库
原项目大量使用了Radix UI组件，需要替换为原生小程序组件或自定义组件：

```typescript
// 原依赖 - 已移除
"@radix-ui/react-dialog": "^1.1.6",
"@radix-ui/react-dropdown-menu": "^2.1.6",
"@radix-ui/react-tabs": "^1.1.3",
// ... 其他Radix UI组件

// 替换方案
// 1. 使用Taro内置组件
// 2. 自定义实现简化版本
// 3. 使用小程序原生组件
```

### 其他移除的依赖
- `vite` → Taro内置构建工具
- `lucide-react` → emoji或自定义图标
- `tailwind-merge` → 自定义样式工具类
- `react-dom` → Taro运行时

## 新增功能

### 1. 小程序特有功能
- 下拉刷新
- 页面分享
- 本地存储
- 系统API调用

### 2. 多端适配
- 条件编译
- 平台特定代码
- 样式适配

### 3. 性能优化
- 按需加载
- 图片懒加载
- 组件缓存

## 开发建议

### 1. 调试方法
- 使用微信开发者工具
- console.log调试
- 网络面板查看请求

### 2. 性能优化
- 控制包大小
- 减少网络请求
- 优化渲染性能

### 3. 用户体验
- loading状态
- 错误处理
- 网络异常处理

## 测试建议

### 1. 功能测试
- 页面跳转
- 数据加载
- 交互操作

### 2. 兼容性测试
- 不同机型
- 不同版本
- 网络状况

### 3. 性能测试
- 启动速度
- 页面渲染
- 内存使用

## 部署流程

### 1. 开发环境
```bash
npm run dev:weapp
```

### 2. 预览测试
```bash
npm run build:weapp
# 微信开发者工具预览
```

### 3. 正式发布
- 上传代码
- 提交审核
- 版本发布

这个迁移过程展示了从现代React应用到Taro小程序的完整转换，保持了原有功能的同时适配了小程序平台的特性。
