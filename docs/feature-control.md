# 功能开关控制系统

## 功能说明

实现了一个完整的功能开关控制系统，允许管理员在后台动态控制小程序功能模块的开关状态。

## 实现内容

### 1. 数据库

**文件**: `database/feature_control.sql`

创建 `feature_settings` 表用于存储功能开关配置：

```sql
CREATE TABLE feature_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_key VARCHAR(100) UNIQUE NOT NULL,  -- 功能键名
    is_enabled TINYINT(1) DEFAULT 1,           -- 是否启用
    feature_name VARCHAR(100) NOT NULL,        -- 功能名称
    description VARCHAR(255),                  -- 功能描述
    offline_message VARCHAR(255),              -- 关闭时提示信息
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

默认配置:
- `flea_market`: 跳蚤市场
- `lost_found`: 失物招领

### 2. 后端 API

#### FeatureController (小程序端接口)

**文件**: `backend/app/Controllers/FeatureController.php`

接口列表:
- `GET /api/feature/settings` - 获取所有功能配置（小程序启动时调用）
- `GET /api/feature/check?feature_key=xxx` - 检查单个功能状态

返回格式:
```json
{
  "success": true,
  "data": {
    "flea_market": {
      "enabled": true,
      "message": "跳蚤市场功能暂时关闭"
    },
    "lost_found": {
      "enabled": true,
      "message": "失物招领功能暂时关闭"
    }
  }
}
```

#### AdminFeatureController (管理后台接口)

**文件**: `backend/app/Controllers/AdminFeatureController.php`

接口列表:
- `GET /api/admin/features/list` - 获取功能列表
- `POST /api/admin/features/update` - 更新功能配置
- `POST /api/admin/features/toggle` - 快速切换功能开关

### 3. 管理后台

**文件**: `frontend-react/src/components/FeatureManagement.tsx`

功能:
- 查看所有功能的开关状态
- 一键开启/关闭功能
- 编辑功能关闭时的提示信息
- 显示最后更新时间

界面特点:
- 使用 Radix UI 组件库（与项目统一）
- 卡片式布局，清晰展示每个功能状态
- Badge 徽章显示开启/关闭状态
- 实时编辑提示信息

### 4. 小程序端

#### 启动时加载配置

**文件**: `frontend-weapp/src/app.tsx`

```typescript
componentDidMount() {
  // 应用启动时加载功能配置
  this.loadFeatureSettings()
  // ...
}

loadFeatureSettings = async () => {
  try {
    const response = await apiService.getFeatureSettings()
    if (response.success && response.data) {
      // 存储到本地缓存
      Taro.setStorageSync('featureSettings', response.data)
    }
  } catch (error) {
    // 失败时使用默认配置
    Taro.setStorageSync('featureSettings', {
      flea_market: { enabled: true, message: '...' },
      lost_found: { enabled: true, message: '...' }
    })
  }
}
```

#### 点击检查功能状态

**文件**: `frontend-weapp/src/pages/index/index.tsx`

```typescript
onAppClick = (app: AppItem) => {
  // 从缓存读取配置
  const featureSettings = Taro.getStorageSync('featureSettings') || {}
  
  switch (app.action) {
    case 'market':
      // 检查跳蚤市场功能
      if (featureSettings.flea_market && !featureSettings.flea_market.enabled) {
        Taro.showToast({
          title: featureSettings.flea_market.message,
          icon: 'none',
          duration: 2000
        })
        return  // 阻止跳转
      }
      Taro.navigateTo({ url: '/pages/flea-market/index' })
      break
    // ...
  }
}
```

#### API Service

**文件**: `frontend-weapp/src/services/api.ts`

新增方法:
```typescript
async getFeatureSettings() {
  return this.request({
    url: '/api/feature/settings',
    method: 'GET',
    needAuth: false  // 不需要登录即可获取
  })
}
```

### 5. 路由配置

**文件**: `backend/routes/api.php`

```php
// 小程序端
$router->add('GET', '/api/feature/settings', 'FeatureController@getFeatureSettings');
$router->add('GET', '/api/feature/check', 'FeatureController@checkFeature');

// 管理后台
$router->add('GET', '/api/admin/features/list', 'AdminFeatureController@getFeatureList');
$router->add('POST', '/api/admin/features/update', 'AdminFeatureController@updateFeature');
$router->add('POST', '/api/admin/features/toggle', 'AdminFeatureController@toggleFeature');
```

## 使用流程

### 管理员操作

1. 登录管理后台
2. 进入"功能开关"页面
3. 查看功能列表和当前状态
4. 点击开关切换功能状态
5. 编辑关闭提示信息（可选）
6. 保存配置

### 小程序端体验

1. 用户打开小程序
2. 小程序启动时自动从后端获取功能配置
3. 配置缓存到本地存储
4. 用户点击功能图标时：
   - 如果功能开启：正常跳转
   - 如果功能关闭：显示提示信息，不跳转

## 技术特点

1. **启动时加载**: 小程序启动时获取配置，避免每次点击都请求后端
2. **本地缓存**: 配置存储在本地，提高响应速度
3. **降级处理**: 接口失败时使用默认配置，保证功能可用
4. **实时生效**: 管理员修改后，用户重启小程序即可生效
5. **灵活扩展**: 可轻松添加更多功能开关

## 数据库迁移

执行以下 SQL 创建表和初始数据:

```bash
mysql -u root -p xisu < database/feature_control.sql
```

## 待优化

1. 可增加功能开关的生效时间控制
2. 可增加针对不同用户组的差异化配置
3. 可增加功能使用统计和分析
4. 可增加版本控制功能，支持配置回滚
