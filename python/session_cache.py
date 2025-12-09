#!/usr/bin/env python3
"""
Session 缓存管理模块（持久化版本）
- 登录后保存 session cookies 到本地文件
- FastAPI 重启后仍能继续使用缓存
- 支持自动过期检测和重新登录
"""

from typing import Dict, Optional
import time
import hashlib
import threading
from dataclasses import dataclass, asdict
import requests
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class CachedSession:
    """缓存的 Session 数据"""
    username: str
    cookies: Dict[str, str]  # Session cookies 转换为字典
    created_at: float
    last_used: float
    hit_count: int = 0
    
    def to_dict(self) -> dict:
        """转换为字典（用于序列化）"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'CachedSession':
        """从字典创建（用于反序列化）"""
        return cls(**data)


class SessionCache:
    """Session 缓存管理器（纯文件缓存，线程安全）"""
    
    def __init__(self, 
                 ttl: int = 7 * 24 * 3600,  # 默认 7 天
                 max_size: int = 100,
                 cache_file: str = "data/sessions.json"):
        """
        初始化缓存
        
        Args:
            ttl: Session 过期时间（秒），默认 7 天
            max_size: 最大缓存数量
            cache_file: 缓存文件路径（相对于此脚本所在目录）
        """
        self._lock = threading.RLock()
        self._ttl = ttl
        self._max_size = max_size
        
        # 转换为绝对路径（相对于此脚本所在目录）
        if not Path(cache_file).is_absolute():
            script_dir = Path(__file__).parent
            self._cache_file = script_dir / cache_file
        else:
            self._cache_file = Path(cache_file)
        
        # 确保数据目录存在
        try:
            self._cache_file.parent.mkdir(parents=True, exist_ok=True)
            logger.info(f"缓存目录已创建/确认: {self._cache_file.parent}")
        except Exception as e:
            logger.error(f"创建缓存目录失败: {e}")
    
    def _get_cache_key(self, username: str, password: str) -> str:
        """
        生成缓存键（使用 hash 避免保存明文密码）
        
        Args:
            username: 用户名
            password: 密码
            
        Returns:
            缓存键（MD5 hash）
        """
        return hashlib.md5(f"{username}:{password}".encode()).hexdigest()
    
    def _load_from_disk(self) -> Dict[str, CachedSession]:
        """从磁盘加载所有缓存"""
        if not self._cache_file.exists():
            return {}
        
        try:
            with open(self._cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cache = {}
            now = time.time()
            
            for key, session_data in data.items():
                try:
                    cached = CachedSession.from_dict(session_data)
                    
                    # 检查是否过期
                    age = now - cached.created_at
                    if age <= self._ttl:
                        cache[key] = cached
                except Exception as e:
                    logger.warning(f"加载缓存条目失败: {e}")
                    continue
            
            return cache
            
        except Exception as e:
            logger.error(f"加载缓存文件失败 {self._cache_file}: {e}")
            return {}
    
    def _save_to_disk(self, cache: Dict[str, CachedSession]) -> None:
        """保存缓存到磁盘"""
        try:
            # 转换为可序列化的格式
            data = {
                key: cached.to_dict() 
                for key, cached in cache.items()
            }
            
            # 确保目录存在
            self._cache_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 原子性写入：先写临时文件，再重命名
            temp_file = self._cache_file.with_suffix('.tmp')
            
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # Windows 和 Linux 兼容的重命名
            if self._cache_file.exists():
                self._cache_file.unlink()
            temp_file.rename(self._cache_file)
            
            logger.debug(f"✓ 保存 {len(cache)} 个缓存到: {self._cache_file.absolute()}")
            
        except Exception as e:
            logger.error(f"✗ 保存缓存文件失败 {self._cache_file}: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def _session_from_cookies(self, cookies_dict: Dict[str, str]) -> requests.Session:
        """从 cookies 字典创建 Session 对象"""
        session = requests.Session()
        for name, value in cookies_dict.items():
            session.cookies.set(name, value)
        return session
    
    def _cookies_to_dict(self, session: requests.Session) -> Dict[str, str]:
        """将 Session 的 cookies 转换为字典"""
        return {cookie.name: cookie.value for cookie in session.cookies}
    
    def get(self, username: str, password: str) -> Optional[requests.Session]:
        """
        获取缓存的 Session（从文件读取）
        
        Args:
            username: 用户名
            password: 密码
            
        Returns:
            缓存的 Session，如果不存在或已过期则返回 None
        """
        with self._lock:
            # 从文件加载最新的缓存
            cache = self._load_from_disk()
            
            key = self._get_cache_key(username, password)
            
            if key not in cache:
                logger.debug(f"缓存未命中: 用户 {username}")
                return None
            
            cached = cache[key]
            
            # 检查是否过期
            age = time.time() - cached.created_at
            if age > self._ttl:
                # 过期，从缓存中删除
                del cache[key]
                self._save_to_disk(cache)
                logger.info(f"用户 {username} 的缓存已过期（存活 {age/3600:.1f} 小时）")
                return None
            
            # 更新使用时间和计数
            cached.last_used = time.time()
            cached.hit_count += 1
            
            # 保存更新后的缓存
            cache[key] = cached
            self._save_to_disk(cache)
            
            # 从 cookies 重建 Session
            session = self._session_from_cookies(cached.cookies)
            
            logger.info(f"缓存命中: 用户 {username}（存活 {age/3600:.1f}h，命中 {cached.hit_count} 次）")
            return session
    
    def set(self, username: str, password: str, session: requests.Session) -> None:
        """
        缓存 Session（写入文件）
        
        Args:
            username: 用户名
            password: 密码
            session: 登录后的 Session 对象
        """
        with self._lock:
            # 从文件加载最新的缓存
            cache = self._load_from_disk()
            
            key = self._get_cache_key(username, password)
            
            # 检查缓存大小，如果超过限制则清理最旧的
            if len(cache) >= self._max_size:
                self._evict_oldest_from_cache(cache)
            
            # 提取 cookies
            cookies_dict = self._cookies_to_dict(session)
            
            if not cookies_dict:
                logger.warning(f"警告: 用户 {username} 的 Session 没有任何 cookies")
            
            # 添加到缓存
            now = time.time()
            cache[key] = CachedSession(
                username=username,
                cookies=cookies_dict,
                created_at=now,
                last_used=now,
                hit_count=0
            )
            
            # 持久化到磁盘
            self._save_to_disk(cache)
            
            logger.info(f"✓ Session 已缓存: 用户 {username}（共 {len(cookies_dict)} 个 cookies）")
    
    def _evict_oldest_from_cache(self, cache: Dict[str, CachedSession]) -> None:
        """清理最久未使用的 Session（LRU）"""
        if not cache:
            return
        
        # 找到最久未使用的
        oldest_key = min(cache.keys(), 
                        key=lambda k: cache[k].last_used)
        oldest_username = cache[oldest_key].username
        
        del cache[oldest_key]
        logger.info(f"LRU 清理: 移除用户 {oldest_username} 的缓存")
    
    def remove(self, username: str, password: str) -> bool:
        """
        移除缓存的 Session（从文件删除）
        
        Args:
            username: 用户名
            password: 密码
            
        Returns:
            是否成功移除
        """
        with self._lock:
            # 从文件加载最新的缓存
            cache = self._load_from_disk()
            
            key = self._get_cache_key(username, password)
            
            if key in cache:
                del cache[key]
                self._save_to_disk(cache)
                logger.info(f"移除缓存: 用户 {username}")
                return True
            
            return False
    
    def clear(self) -> None:
        """清空所有缓存（清空文件）"""
        with self._lock:
            cache = self._load_from_disk()
            count = len(cache)
            self._save_to_disk({})
            logger.info(f"清空所有缓存: 共 {count} 个")
    
    def cleanup_expired(self) -> int:
        """
        清理所有过期的 Session（从文件清理）
        
        Returns:
            清理的数量
        """
        with self._lock:
            cache = self._load_from_disk()
            now = time.time()
            expired_keys = [
                key for key, cached in cache.items()
                if (now - cached.created_at) > self._ttl
            ]
            
            for key in expired_keys:
                username = cache[key].username
                del cache[key]
                logger.info(f"清理过期缓存: 用户 {username}")
            
            if expired_keys:
                self._save_to_disk(cache)
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict:
        """
        获取缓存统计信息（从文件读取）
        
        Returns:
            统计信息字典
        """
        with self._lock:
            cache = self._load_from_disk()
            
            return {
                'cache_size': len(cache),
                'cache_file': str(self._cache_file),
                'cache_file_exists': self._cache_file.exists(),
                'ttl_seconds': self._ttl,
                'ttl_days': round(self._ttl / 86400, 1),
                'max_size': self._max_size
            }
    
    def get_cache_info(self) -> Dict:
        """
        获取所有缓存的详细信息（从文件读取）
        
        Returns:
            缓存详情字典
        """
        with self._lock:
            cache = self._load_from_disk()
            now = time.time()
            info = {}
            
            for key, cached in cache.items():
                age = now - cached.created_at
                idle = now - cached.last_used
                
                info[cached.username] = {
                    'age_seconds': int(age),
                    'age_hours': round(age / 3600, 1),
                    'age_days': round(age / 86400, 1),
                    'idle_seconds': int(idle),
                    'idle_hours': round(idle / 3600, 1),
                    'hit_count': cached.hit_count,
                    'expires_in_seconds': int(self._ttl - age),
                    'expires_in_hours': round((self._ttl - age) / 3600, 1),
                    'expires_in_days': round((self._ttl - age) / 86400, 1),
                    'cookies_count': len(cached.cookies)
                }
            
            return info


# 全局缓存实例
_global_cache: Optional[SessionCache] = None


def get_session_cache() -> SessionCache:
    """获取全局 Session 缓存实例（持久化版本）"""
    global _global_cache
    if _global_cache is None:
        _global_cache = SessionCache(
            ttl=7 * 24 * 3600,  # 7 天
            max_size=100,
            cache_file="data/sessions.json"
        )
    return _global_cache


def init_session_cache(
    ttl: int = 7 * 24 * 3600, 
    max_size: int = 100,
    cache_file: str = "data/sessions.json"
) -> SessionCache:
    """
    初始化全局 Session 缓存
    
    Args:
        ttl: Session 过期时间（秒），默认 7 天
        max_size: 最大缓存数量
        cache_file: 缓存文件路径
        
    Returns:
        SessionCache 实例
    """
    global _global_cache
    _global_cache = SessionCache(ttl=ttl, max_size=max_size, cache_file=cache_file)
    return _global_cache


# 使用示例
if __name__ == "__main__":
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # 创建持久化缓存
    cache = SessionCache(
        ttl=7 * 24 * 3600,  # 7 天
        max_size=100,
        cache_file="data/test_sessions.json"
    )
    
    username = "test_user"
    password = "test_pass"
    
    # 第一次获取（缓存未命中）
    session = cache.get(username, password)
    print(f"\n第一次获取: {session}")  # None
    
    # 登录并缓存
    session = requests.Session()
    session.cookies.set("JSESSIONID", "TEST_SESSION_123")
    session.cookies.set("route", "server1")
    cache.set(username, password, session)
    print(f"Session 已缓存到: {cache._cache_file}")
    
    # 第二次获取（缓存命中）
    session = cache.get(username, password)
    print(f"\n第二次获取: {session}")  # <Session object>
    print(f"Cookies: {session.cookies.get_dict() if session else 'None'}")
    
    # 查看统计
    print(f"\n缓存统计:\n{json.dumps(cache.get_stats(), indent=2, ensure_ascii=False)}")
    
    # 查看缓存信息
    print(f"\n缓存详情:\n{json.dumps(cache.get_cache_info(), indent=2, ensure_ascii=False)}")
    
    # 模拟重启：创建新实例
    print("\n--- 模拟应用重启 ---")
    cache2 = SessionCache(cache_file="data/test_sessions.json")
    session = cache2.get(username, password)
    print(f"重启后获取: {session}")
    print(f"Cookies: {session.cookies.get_dict() if session else 'None'}")
    print(f"\n重启后统计:\n{json.dumps(cache2.get_stats(), indent=2, ensure_ascii=False)}")
