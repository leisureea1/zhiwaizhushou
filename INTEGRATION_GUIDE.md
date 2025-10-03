# 小程序前后端对接说明文档

## 📋 概述

本文档说明了西外小助手小程序前端（Taro）与后端（PHP）的对接方式。

## 🔧 配置说明

### 1. 后端配置

**后端地址**: `http://localhost:8000`

确保PHP后端服务正在运行：
```bash
cd /Users/apple/Desktop/xisu/backend
php -S localhost:8000 -t public
```

### 2. 前端配置

前端API基础地址已配置在 `/frontend-weapp/src/services/api.ts`:
```typescript
const BASE_URL = 'http://localhost:8000'
```

**生产环境部署时需要修改为实际的服务器地址。**

## 🔐 API接口对接

### 用户认证

#### 1. 用户注册
- **接口**: `POST /api/user/register`
- **前端方法**: `apiService.register()`
- **请求参数**:
  ```typescript
  {
    username: string,      // 用户名
    password: string,      // 密码
    studentId: string,     // 学号
    jwxtPassword: string   // 网办大厅密码
  }
  ```
- **后端字段映射**:
  ```php
  student_id => studentId
  name => username
  password => password
  email => "{studentId}@temp.com"  // 临时邮箱
  edu_system_username => studentId
  edu_system_password => jwxtPassword
  ```

#### 2. 用户登录
- **接口**: `POST /api/user/login`
- **前端方法**: `apiService.login()`
- **请求参数**:
  ```typescript
  {
    username: string,  // 用户名或学号
    password: string   // 密码
  }
  ```
- **返回数据**:
  ```json
  {
    "message": "登录成功",
    "user_id": 1,
    "student_id": "107242024000080",
    "name": "张三",
    "role": "student",
    "token": "abc123...",
    "edu_system_username": "107242024000080",
    "edu_system_password": "密码"
  }
  ```
- **前端存储**:
  - `userToken`: 存储token用于后续请求认证
  - `userInfo`: 存储用户基本信息

### 课程相关

#### 3. 获取课程表
- **接口**: `GET /api/course/schedule`
- **前端方法**: `apiService.getCourseSchedule()`
- **需要认证**: ✅
- **请求参数**:
  ```typescript
  {
    username: string,
    password: string
  }
  ```

#### 4. 获取成绩
- **接口**: `GET /api/course/grades`
- **前端方法**: `apiService.getGrades()`
- **需要认证**: ✅

### 其他接口

#### 5. 公告列表
- **接口**: `GET /api/announcement/list`
- **前端方法**: `apiService.getAnnouncements()`

#### 6. 跳蚤市场
- **接口**: `GET /api/flea-market/list`
- **前端方法**: `apiService.getFleaMarketList()`

#### 7. 失物招领
- **接口**: `GET /api/lost-found/list`
- **前端方法**: `apiService.getLostFoundList()`

## 🔑 认证机制

### Token使用

1. **登录成功后**，后端返回token
2. **前端存储**到本地存储：`Taro.setStorageSync('userToken', token)`
3. **后续请求**，对于需要认证的接口：
   ```typescript
   apiService.request({
     url: '/api/xxx',
     needAuth: true  // 会自动添加 Authorization header
   })
   ```

### Headers配置

需要认证的请求会自动添加：
```
Authorization: Bearer {token}
```

## 📝 使用示例

### 登录流程

```typescript
// 1. 用户填写表单
const username = '张三'
const password = '123456'

// 2. 调用登录API
try {
  const response = await apiService.login(username, password)
  
  // 3. 保存token和用户信息
  Taro.setStorageSync('userToken', response.token)
  Taro.setStorageSync('userInfo', {
    userId: response.user_id,
    studentId: response.student_id,
    name: response.name,
    role: response.role
  })
  
  // 4. 提示成功并跳转
  Taro.showToast({ title: '登录成功', icon: 'success' })
  Taro.navigateBack()
  
} catch (error) {
  Taro.showToast({ title: error.message, icon: 'none' })
}
```

### 注册流程

```typescript
// 1. 用户填写表单
const data = {
  username: '张三',
  password: '123456',
  studentId: '107242024000080',
  jwxtPassword: 'jwxt123'
}

// 2. 调用注册API
try {
  await apiService.register(data)
  
  // 3. 提示成功并切换到登录
  Taro.showToast({ title: '注册成功', icon: 'success' })
  // 切换到登录模式...
  
} catch (error) {
  Taro.showToast({ title: error.message, icon: 'none' })
}
```

### 获取课程表

```typescript
// 1. 从本地获取用户信息
const userInfo = Taro.getStorageSync('userInfo')

// 2. 调用课程表API
try {
  const schedule = await apiService.getCourseSchedule(
    userInfo.edu_system_username,
    userInfo.edu_system_password
  )
  
  // 3. 显示课程表数据
  console.log(schedule)
  
} catch (error) {
  Taro.showToast({ title: '获取课程表失败', icon: 'none' })
}
```

## ⚠️ 注意事项

### 1. CORS配置

如果遇到跨域问题，需要在PHP后端添加CORS头：

```php
// public/index.php 顶部添加
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

### 2. 小程序域名配置

生产环境需要在微信小程序后台配置服务器域名：
- 开发 > 开发管理 > 开发设置 > 服务器域名
- 添加后端API域名（必须是HTTPS）

### 3. 错误处理

所有API调用都应使用try-catch处理错误：
```typescript
try {
  const result = await apiService.xxx()
} catch (error: any) {
  // 显示友好的错误提示
  Taro.showToast({
    title: error.message || '操作失败',
    icon: 'none'
  })
}
```

### 4. 邮箱验证

当前版本暂时跳过了邮箱验证检查，方便开发测试。生产环境需要：
1. 配置SMTP邮箱服务
2. 取消UserController中的邮箱验证注释
3. 完善邮箱验证流程

## 🚀 部署建议

### 开发环境
- 前端：`npm run dev:weapp`
- 后端：`php -S localhost:8000 -t public`

### 生产环境
1. 后端部署到支持PHP的服务器（Apache/Nginx + PHP-FPM）
2. 配置HTTPS证书
3. 修改前端BASE_URL为生产环境地址
4. 在微信小程序后台配置服务器域名
5. 重新编译并上传小程序代码

## 📞 技术支持

如有问题，请检查：
1. 后端服务是否正常运行
2. 数据库连接是否正常
3. API接口返回的错误信息
4. 浏览器/小程序控制台的错误日志
