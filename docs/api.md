# 校园小程序API接口文档

本文档描述了校园小程序的所有API接口，所有接口均返回JSON格式数据。

## 基础响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

错误响应格式：
```json
{
  "success": false,
  "message": "错误信息",
  "data": {}
}
```

## 1. 用户模块

### 1.1 用户注册

**请求URL**: `/api/user/register`

**请求方法**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| student_id | string | 是 | 学号 |
| name | string | 是 | 姓名 |
| password | string | 是 | 密码 |
| edu_username | string | 是 | 教务系统账号 |
| edu_password | string | 是 | 教务系统密码 |
| email | string | 是 | 邮箱 |

**响应示例**:

```json
{
  "success": true,
  "message": "注册成功，请查收邮件进行验证",
  "data": {
    "user_id": 1
  }
}
```

### 1.2 用户登录

**请求URL**: `/api/user/login`

**请求方法**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| student_id | string | 是 | 学号 |
| password | string | 是 | 密码 |

**响应示例**:

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user_id": 1,
    "student_id": "2021001",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 找回密码

**请求URL**: `/api/user/forgot-password`

**请求方法**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 邮箱 |

**响应示例**:

```json
{
  "success": true,
  "message": "密码重置链接已发送至您的邮箱"
}
```

### 1.4 修改密码

**请求URL**: `/api/user/change-password`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码 |

**响应示例**:

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

## 2. 课程模块

### 2.1 获取课表

**请求URL**: `/api/course/schedule`

**请求方法**: GET

**Headers**: 
- Authorization: Bearer \<token\>

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "course_id": 1,
      "name": "高等数学",
      "teacher": "李老师",
      "classroom": "A101",
      "day": 1,
      "start_time": "08:00",
      "end_time": "09:30"
    }
  ]
}
```

### 2.2 获取成绩

**请求URL**: `/api/course/grades`

**请求方法**: GET

**Headers**: 
- Authorization: Bearer \<token\>

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "course_id": 1,
      "name": "高等数学",
      "credit": 4,
      "grade": 85
    }
  ]
}
```

## 3. 公告模块

### 3.1 获取公告列表

**请求URL**: `/api/announcement/list`

**请求方法**: GET

**Query参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页条数，默认10 |

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "关于期末考试安排的通知",
        "author": "教务处",
        "created_at": "2023-06-01 08:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 3.2 获取公告详情

**请求URL**: `/api/announcement/detail`

**请求方法**: GET

**Query参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 公告ID |

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "关于期末考试安排的通知",
    "content": "各位同学：\n期末考试将于第18周进行...",
    "author": "教务处",
    "created_at": "2023-06-01 08:00:00"
  }
}
```

## 4. 跳蚤市场模块

### 4.1 获取商品列表

**请求URL**: `/api/flea-market/list`

**请求方法**: GET

**Query参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页条数，默认10 |

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "二手笔记本电脑",
        "description": "联想ThinkPad，2020年购买",
        "price": 3500,
        "image_url": "http://example.com/image.jpg",
        "publisher": "张三",
        "status": "approved",
        "created_at": "2023-06-01 10:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 4.2 发布商品

**请求URL**: `/api/flea-market/create`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 商品标题 |
| description | string | 是 | 商品描述 |
| price | float | 是 | 价格 |
| image_url | string | 否 | 图片URL |

**响应示例**:

```json
{
  "success": true,
  "message": "发布成功，等待审核",
  "data": {
    "id": 1
  }
}
```

### 4.3 编辑商品

**请求URL**: `/api/flea-market/update`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 商品ID |
| title | string | 是 | 商品标题 |
| description | string | 是 | 商品描述 |
| price | float | 是 | 价格 |
| image_url | string | 否 | 图片URL |

**响应示例**:

```json
{
  "success": true,
  "message": "编辑成功"
}
```

### 4.4 删除商品

**请求URL**: `/api/flea-market/delete`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 商品ID |

**响应示例**:

```json
{
  "success": true,
  "message": "删除成功"
}
```

## 5. 失物招领模块

### 5.1 获取失物招领列表

**请求URL**: `/api/lost-found/list`

**请求方法**: GET

**Query参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页条数，默认10 |

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "description": "黑色钱包，内有身份证",
        "image_url": "http://example.com/image.jpg",
        "status": "lost",
        "publisher": "李四",
        "created_at": "2023-06-01 12:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 5.2 发布失物招领信息

**请求URL**: `/api/lost-found/create`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| description | string | 是 | 物品描述 |
| image_url | string | 否 | 图片URL |
| status | string | 是 | 状态（lost/found） |

**响应示例**:

```json
{
  "success": true,
  "message": "发布成功，等待审核",
  "data": {
    "id": 1
  }
}
```

### 5.3 编辑失物招领信息

**请求URL**: `/api/lost-found/update`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 信息ID |
| description | string | 是 | 物品描述 |
| image_url | string | 否 | 图片URL |
| status | string | 是 | 状态（lost/found） |

**响应示例**:

```json
{
  "success": true,
  "message": "编辑成功"
}
```

### 5.4 删除失物招领信息

**请求URL**: `/api/lost-found/delete`

**请求方法**: POST

**Headers**: 
- Authorization: Bearer \<token\>

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 信息ID |

**响应示例**:

```json
{
  "success": true,
  "message": "删除成功"
}
```