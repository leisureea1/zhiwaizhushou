"""
Session 缓存管理服务
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
    cookies: Dict[str, str]
    created_at: float
    last_used: float
    hit_count: int = 0
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'CachedSession':
        return cls(**data)


class SessionCache:
    """Session 缓存管理器"""
    
    def __init__(self, ttl: int = 7 * 24 * 3600, max_size: int = 100, cache_file: str = "data/sessions.json"):
        self._lock = threading.RLock()
        self._ttl = ttl
        self._max_size = max_size
        
        if not Path(cache_file).is_absolute():
            script_dir = Path(__file__).parent.parent.parent
            self._cache_file = script_dir / cache_file
        else:
            self._cache_file = Path(cache_file)
        
        try:
            self._cache_file.parent.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.error(f"创建缓存目录失败: {e}")
    
    def _get_cache_key(self, username: str, password: str) -> str:
        return hashlib.md5(f"{username}:{password}".encode()).hexdigest()
    
    def _load_from_disk(self) -> Dict[str, CachedSession]:
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
                    if (now - cached.created_at) <= self._ttl:
                        cache[key] = cached
                except Exception:
                    continue
            
            return cache
        except Exception as e:
            logger.error(f"加载缓存文件失败: {e}")
            return {}
    
    def _save_to_disk(self, cache: Dict[str, CachedSession]) -> None:
        try:
            data = {key: cached.to_dict() for key, cached in cache.items()}
            self._cache_file.parent.mkdir(parents=True, exist_ok=True)
            
            temp_file = self._cache_file.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            if self._cache_file.exists():
                self._cache_file.unlink()
            temp_file.rename(self._cache_file)
        except Exception as e:
            logger.error(f"保存缓存文件失败: {e}")

    def _session_from_cookies(self, cookies_dict: Dict[str, str]) -> requests.Session:
        session = requests.Session()
        for name, value in cookies_dict.items():
            session.cookies.set(name, value)
        return session
    
    def _cookies_to_dict(self, session: requests.Session) -> Dict[str, str]:
        return {cookie.name: cookie.value for cookie in session.cookies}
    
    def get(self, username: str, password: str) -> Optional[requests.Session]:
        """获取缓存的 Session"""
        with self._lock:
            cache = self._load_from_disk()
            key = self._get_cache_key(username, password)
            
            if key not in cache:
                return None
            
            cached = cache[key]
            age = time.time() - cached.created_at
            
            if age > self._ttl:
                del cache[key]
                self._save_to_disk(cache)
                return None
            
            cached.last_used = time.time()
            cached.hit_count += 1
            cache[key] = cached
            self._save_to_disk(cache)
            
            return self._session_from_cookies(cached.cookies)
    
    def set(self, username: str, password: str, session: requests.Session) -> None:
        """缓存 Session"""
        with self._lock:
            cache = self._load_from_disk()
            key = self._get_cache_key(username, password)
            
            if len(cache) >= self._max_size:
                self._evict_oldest(cache)
            
            cookies_dict = self._cookies_to_dict(session)
            now = time.time()
            
            cache[key] = CachedSession(
                username=username,
                cookies=cookies_dict,
                created_at=now,
                last_used=now,
                hit_count=0
            )
            self._save_to_disk(cache)
    
    def _evict_oldest(self, cache: Dict[str, CachedSession]) -> None:
        if not cache:
            return
        oldest_key = min(cache.keys(), key=lambda k: cache[k].last_used)
        del cache[oldest_key]
    
    def remove(self, username: str, password: str) -> bool:
        """移除缓存"""
        with self._lock:
            cache = self._load_from_disk()
            key = self._get_cache_key(username, password)
            
            if key in cache:
                del cache[key]
                self._save_to_disk(cache)
                return True
            return False
    
    def clear(self) -> None:
        """清空所有缓存"""
        with self._lock:
            self._save_to_disk({})
    
    def get_stats(self) -> Dict:
        """获取缓存统计"""
        with self._lock:
            cache = self._load_from_disk()
            return {
                'cache_size': len(cache),
                'cache_file': str(self._cache_file),
                'ttl_days': round(self._ttl / 86400, 1),
                'max_size': self._max_size
            }
    
    def get_cache_info(self) -> Dict:
        """获取缓存详情"""
        with self._lock:
            cache = self._load_from_disk()
            now = time.time()
            info = {}
            
            for key, cached in cache.items():
                age = now - cached.created_at
                info[cached.username] = {
                    'age_hours': round(age / 3600, 1),
                    'hit_count': cached.hit_count,
                    'expires_in_hours': round((self._ttl - age) / 3600, 1),
                }
            return info


# 全局缓存实例
_global_cache: Optional[SessionCache] = None


def get_session_cache() -> SessionCache:
    """获取全局 Session 缓存实例"""
    global _global_cache
    if _global_cache is None:
        _global_cache = SessionCache()
    return _global_cache
