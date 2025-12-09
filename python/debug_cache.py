#!/usr/bin/env python3
"""
调试持久化缓存 - 检查文件写入
"""
import sys
import os
from pathlib import Path
import logging

# 配置详细日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

sys.path.insert(0, str(Path(__file__).parent))

from session_cache import SessionCache
import requests
import json

print("=" * 70)
print("调试信息")
print("=" * 70)
print(f"当前工作目录: {os.getcwd()}")
print(f"脚本所在目录: {Path(__file__).parent.absolute()}")
print(f"Python 版本: {sys.version}")
print(f"用户: {os.getenv('USER') or os.getenv('USERNAME')}")

print("\n" + "=" * 70)
print("创建缓存实例")
print("=" * 70)

cache = SessionCache(
    ttl=7 * 24 * 3600,
    max_size=100,
    cache_file="data/sessions.json"
)

print(f"缓存文件路径: {cache._cache_file}")
print(f"缓存文件绝对路径: {cache._cache_file.absolute()}")
print(f"缓存目录存在: {cache._cache_file.parent.exists()}")
print(f"缓存目录权限: {oct(os.stat(cache._cache_file.parent).st_mode)[-3:]}")

print("\n" + "=" * 70)
print("测试写入")
print("=" * 70)

username = "test_user_debug"
password = "test_password_debug"

# 创建 Session
session = requests.Session()
session.cookies.set("JSESSIONID", "DEBUG_SESSION_123")
session.cookies.set("test_cookie", "test_value")

print(f"\n准备缓存用户: {username}")
print(f"Cookies 数量: {len(session.cookies)}")

# 调用 set 方法
cache.set(username, password, session)

print("\n" + "=" * 70)
print("验证文件")
print("=" * 70)

print(f"缓存文件存在: {cache._cache_file.exists()}")
if cache._cache_file.exists():
    print(f"文件大小: {cache._cache_file.stat().st_size} bytes")
    print(f"文件权限: {oct(cache._cache_file.stat().st_mode)[-3:]}")
    
    print("\n文件内容:")
    print("-" * 70)
    with open(cache._cache_file, 'r', encoding='utf-8') as f:
        content = f.read()
        print(content)
    print("-" * 70)
else:
    print("✗ 文件不存在！")
    
    # 尝试手动创建
    print("\n尝试手动创建文件...")
    try:
        with open(cache._cache_file, 'w', encoding='utf-8') as f:
            f.write('{"test": "manual write"}')
        print(f"✓ 手动创建成功: {cache._cache_file}")
    except Exception as e:
        print(f"✗ 手动创建失败: {e}")

print("\n" + "=" * 70)
print("缓存统计")
print("=" * 70)
print(json.dumps(cache.get_stats(), indent=2, ensure_ascii=False))

print("\n" + "=" * 70)
print("测试读取")
print("=" * 70)

# 创建新实例测试加载
cache2 = SessionCache(cache_file="data/sessions.json")
session2 = cache2.get(username, password)

if session2:
    print(f"✓ 成功从文件加载缓存")
    print(f"  Cookies: {session2.cookies.get_dict()}")
else:
    print(f"✗ 无法从文件加载缓存")

print("\n" + "=" * 70)
print("完成")
print("=" * 70)
