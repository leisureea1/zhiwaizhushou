# Session 持久化缓存升级说明

## 主要改进

### 1. 持久化存储
- **改进前**：Session 仅存在内存中，TTL=30分钟，FastAPI 重启后丢失
- **改进后**：Session cookies 保存到 `data/sessions.json`，重启后自动加载

### 2. 缓存有效期延长
- **改进前**：30 分钟过期
- **改进后**：7 天过期

### 3. Session 失效自动重登录
- **改进前**：使用缓存的 session 时，如果服务器端已过期会返回错误
- **改进后**：自动检测 session 失效，清除缓存并重新登录

## 技术实现

### 文件存储
```python
# 缓存文件路径（相对于 session_cache.py 所在目录）
cache_file = Path(__file__).parent / "data/sessions.json"
```

### 数据结构
```json
{
  "用户哈希值": {
    "username": "学号",
    "cookies": {
      "JSESSIONID": "...",
      "iPlanetDirectoryPro": "...",
      "route": "..."
    },
    "created_at": 1762172318.36,
    "last_used": 1762172318.36,
    "hit_count": 0
  }
}
```

### Session 验证机制

#### /course 端点
1. 尝试从缓存获取 session
2. 如果命中缓存，先调用 `get_user_info()` 验证 session 有效性
3. 如果验证失败，清除缓存并重新登录
4. 继续执行后续业务逻辑

```python
if cached_session is not None:
    api.session = cached_session
    user_info = api.get_user_info()
    
    if not user_info.get("success"):
        # Session 已过期，清除缓存
        session_cache.remove(username, password)
        need_login = True
```

#### /grade 端点
1. 尝试从缓存获取 session
2. 如果命中缓存，直接调用 `get_grades()`
3. 如果失败，清除缓存并重新登录
4. 重新获取成绩

#### /semester 和 /user 端点
类似逻辑，确保 session 失效时自动重登录

## 性能优化

### 写入策略
- **get() 操作**：不写入磁盘，避免频繁 I/O
- **set() 操作**：登录后立即写入磁盘
- **remove() 操作**：删除缓存时写入磁盘
- **过期清理**：检测到过期时写入磁盘

### 原子性写入
```python
# 先写临时文件，再重命名（防止写入过程中崩溃导致数据损坏）
temp_file = cache_file.with_suffix('.tmp')
with open(temp_file, 'w') as f:
    json.dump(data, f)
temp_file.rename(cache_file)
```

## 使用方法

### 启动 FastAPI
```bash
cd python
python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000
```

### 查看缓存统计
```bash
curl http://127.0.0.1:8000/cache/stats
```

### 查看缓存详情
```bash
curl http://127.0.0.1:8000/cache/info
```

### 清空缓存
```bash
curl -X POST http://127.0.0.1:8000/cache/clear
```

## 测试

### 基本功能测试
```bash
cd python
python3 session_cache.py
```

### 持久化测试
```bash
cd python
python3 test_persistent.py
```

## 日志示例

### 首次登录
```
2025-11-03 20:08:22 - INFO - [/course] Cache MISS for user 107242024000080, logging in...
2025-11-03 20:08:25 - INFO - [/course] Login took 2.83s
2025-11-03 20:08:25 - INFO - 准备缓存 Session: 用户 107242024000080（共 3 个 cookies）
2025-11-03 20:08:25 - INFO - 正在保存缓存到: /path/to/python/data/sessions.json
2025-11-03 20:08:25 - INFO - ✓ 成功保存 1 个缓存到: /path/to/python/data/sessions.json
2025-11-03 20:08:25 - INFO - ✓ Session 已缓存: 用户 107242024000080
```

### 缓存命中
```
2025-11-03 20:10:15 - INFO - [/course] Cache HIT for user 107242024000080
2025-11-03 20:10:15 - INFO - 缓存命中: 用户 107242024000080（存活 0.5h，命中 3 次）
2025-11-03 20:10:15 - INFO - [/course] Get user info took 0.42s
```

### Session 过期自动重登录
```
2025-11-03 22:15:30 - INFO - [/course] Cache HIT for user 107242024000080
2025-11-03 22:15:31 - WARNING - [/course] Cached session invalid for 107242024000080, re-login required
2025-11-03 22:15:31 - INFO - 移除缓存: 用户 107242024000080
2025-11-03 22:15:31 - INFO - [/course] Cache MISS for user 107242024000080, logging in...
2025-11-03 22:15:34 - INFO - [/course] Login took 2.91s
2025-11-03 22:15:34 - INFO - ✓ Session 已缓存: 用户 107242024000080
```

## 注意事项

1. **缓存文件权限**：确保 `data/sessions.json` 有读写权限
2. **并发安全**：使用 `threading.RLock()` 确保线程安全
3. **服务器端过期**：即使本地缓存未过期（7天内），服务器端 session 可能更早过期（通常几小时），代码会自动检测并重登录
4. **密码哈希**：缓存键使用 MD5(username:password)，不保存明文密码
5. **多进程部署**：如果使用多个 worker，每个进程有独立的内存缓存，但共享磁盘文件

## 故障排查

### 问题：缓存文件未创建
**可能原因**：
- `data/` 目录不存在或无写入权限
- 磁盘空间不足

**解决方案**：
```bash
mkdir -p python/data
chmod 755 python/data
```

### 问题：Session 过期后返回错误而不是重登录
**可能原因**：旧版本代码未检测 session 失效

**解决方案**：更新到最新版本，确保所有端点都有 session 验证逻辑

### 问题：Linux 下无法保存缓存
**可能原因**：
- 相对路径问题
- 权限问题

**解决方案**：
代码已改为使用绝对路径（相对于 `session_cache.py` 所在目录）：
```python
script_dir = Path(__file__).parent
cache_file = script_dir / "data/sessions.json"
```

## 性能对比

| 场景 | 改进前 | 改进后 |
|------|--------|--------|
| 首次请求 | 10-15s | 10-15s（需要登录） |
| 缓存命中 | 1-3s | 0.5-2s |
| 重启后首次请求 | 10-15s（需重登录） | 0.5-2s（加载缓存） |
| 缓存过期 | 30分钟 | 7天（或服务器端过期） |
| Session 失效处理 | 返回错误 | 自动重登录 |

## 版本历史

### v2.0（当前版本）
- ✅ 持久化缓存到 `data/sessions.json`
- ✅ 缓存有效期延长到 7 天
- ✅ Session 失效自动重登录
- ✅ 增强的日志和错误处理
- ✅ Linux 兼容性修复

### v1.0（旧版本）
- 内存缓存，TTL=30分钟
- FastAPI 重启后丢失
- Session 失效时返回错误
