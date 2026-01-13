# 图标配置指南

本项目使用 Material Icons 风格图标。由于微信小程序限制，需要通过 iconfont.cn 配置。

## 配置步骤

### 1. 访问 iconfont.cn
打开 https://www.iconfont.cn/

### 2. 搜索并添加图标
搜索以下图标名称（Material Design 风格）：

**导航类：**
- menu
- arrow_back / arrow_back_ios_new  
- chevron_right
- arrow_drop_down
- search
- sync
- send

**用户类：**
- school
- badge
- lock / lock_reset
- vpn_key
- visibility / visibility_off
- person
- edit_note
- notifications_none

**日历时间：**
- calendar_today
- schedule
- event_note

**学习类：**
- restaurant_menu
- auto_awesome (AI 图标)
- fact_check
- assignment_ind
- class
- workspace_premium
- menu_book
- rate_review
- history_edu
- functions
- terminal
- translate
- biotech
- sports_basketball
- code

**生活服务：**
- map
- directions_bus
- wifi
- local_laundry_service
- local_post_office
- qr_code
- location_on
- near_me

**信息设置：**
- campaign
- account_balance
- contact_phone
- settings
- info

**天气：**
- wb_sunny
- nights_stay

### 3. 生成代码
1. 将图标添加到项目
2. 点击 "Font class" 
3. 点击 "生成代码"
4. 复制在线链接或下载到本地

### 4. 引入项目
在 `src/app.scss` 中添加：

```scss
// 方式1：在线链接（需配置域名白名单）
@import url('//at.alicdn.com/t/c/font_xxxxx.css');

// 方式2：本地文件
@import './assets/iconfont/iconfont.css';
```

### 5. 使用图标
```tsx
<Text className='iconfont icon-calendar' />
```
