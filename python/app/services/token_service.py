"""
Token 会话管理服务

实现基于 token 的会话管理，支持 Redis 缓存
NestJS 登录后获取 token，后续请求只需携带 token
"""

import secrets
import time
import hashlib
import logging
import json
from typing import Optional, Dict, Tuple
from dataclasses import dataclass, asdict
import requests
import redis
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class TokenSession:
    """Token 对应的会话数据"""
    token: str
    username: str
    cookies: Dict[str, str]
    user_info: Dict  # 用户信息缓存
    created_at: float
    expires_at: float
    last_used: float
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'TokenSession':
        return cls(**data)
    
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class TokenService:
    """Token 会话管理器"""
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/1",
        token_ttl: int = 3600,  # token 有效期 1 小时
        session_ttl: int = 7 * 24 * 3600,  # 教务系统会话有效期 7 天
    ):
        self._token_ttl = token_ttl
        self._session_ttl = session_ttl
        self._redis: Optional[redis.Redis] = None
        self._redis_url = redis_url
        self._fallback_cache: Dict[str, TokenSession] = {}  # Redis 不可用时的后备缓存
        
        try:
            self._redis = redis.from_url(redis_url, decode_responses=True)
            self._redis.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.warning(f"Redis 连接失败，使用内存缓存: {e}")
            self._redis = None
    
    def _generate_token(self) -> str:
        """生成安全的随机 token"""
        return secrets.token_urlsafe(32)
    
    def _get_redis_key(self, token: str) -> str:
        """获取 Redis 键名"""
        return f"jwxt:token:{token}"
    
    def _session_from_cookies(self, cookies_dict: Dict[str, str]) -> requests.Session:
        """从 cookies 字典创建 requests.Session"""
        session = requests.Session()
        for name, value in cookies_dict.items():
            session.cookies.set(name, value)
        return session
    
    def _cookies_to_dict(self, session: requests.Session) -> Dict[str, str]:
        """将 requests.Session 的 cookies 转为字典"""
        return {cookie.name: cookie.value for cookie in session.cookies}
    
    def create_token(
        self,
        username: str,
        session: requests.Session,
        user_info: Dict,
    ) -> Tuple[str, int]:
        """
        创建新的 token
        
        Args:
            username: 用户名（学号）
            session: 教务系统的 requests.Session
            user_info: 用户信息
        
        Returns:
            (token, expires_in) 元组
        """
        token = self._generate_token()
        now = time.time()
        
        token_session = TokenSession(
            token=token,
            username=username,
            cookies=self._cookies_to_dict(session),
            user_info=user_info,
            created_at=now,
            expires_at=now + self._token_ttl,
            last_used=now,
        )
        
        # 存储到 Redis 或内存
        if self._redis:
            try:
                self._redis.setex(
                    self._get_redis_key(token),
                    self._token_ttl,
                    json.dumps(token_session.to_dict(), ensure_ascii=False)
                )
            except Exception as e:
                logger.error(f"Redis 存储失败: {e}")
                self._fallback_cache[token] = token_session
        else:
            self._fallback_cache[token] = token_session
        
        logger.info(f"[TokenService] Created token for {username}, expires in {self._token_ttl}s")
        return token, self._token_ttl
    
    def get_session(self, token: str) -> Optional[Tuple[requests.Session, Dict]]:
        """
        通过 token 获取会话和用户信息
        
        Args:
            token: 访问令牌
        
        Returns:
            (session, user_info) 或 None（token 无效/过期）
        """
        token_session = self._get_token_session(token)
        if not token_session:
            return None
        
        if token_session.is_expired():
            self._remove_token(token)
            return None
        
        # 更新最后使用时间
        token_session.last_used = time.time()
        self._update_token_session(token, token_session)
        
        session = self._session_from_cookies(token_session.cookies)
        return session, token_session.user_info
    
    def get_username(self, token: str) -> Optional[str]:
        """通过 token 获取用户名"""
        token_session = self._get_token_session(token)
        if token_session and not token_session.is_expired():
            return token_session.username
        return None
    
    def refresh_token(self, token: str, session: requests.Session) -> bool:
        """
        刷新 token 对应的教务系统会话（用于会话过期后重新登录）
        
        Args:
            token: 访问令牌
            session: 新的教务系统 session
        
        Returns:
            是否成功
        """
        token_session = self._get_token_session(token)
        if not token_session:
            return False
        
        token_session.cookies = self._cookies_to_dict(session)
        token_session.last_used = time.time()
        # 延长 token 有效期
        token_session.expires_at = time.time() + self._token_ttl
        
        self._update_token_session(token, token_session)
        logger.info(f"[TokenService] Refreshed session for token")
        return True
    
    def invalidate_token(self, token: str) -> bool:
        """使 token 失效"""
        return self._remove_token(token)
    
    def _get_token_session(self, token: str) -> Optional[TokenSession]:
        """从存储获取 TokenSession"""
        if self._redis:
            try:
                data = self._redis.get(self._get_redis_key(token))
                if data:
                    return TokenSession.from_dict(json.loads(data))
            except Exception as e:
                logger.error(f"Redis 读取失败: {e}")
        
        # 后备：内存缓存
        return self._fallback_cache.get(token)
    
    def _update_token_session(self, token: str, token_session: TokenSession) -> None:
        """更新存储中的 TokenSession"""
        if self._redis:
            try:
                ttl = int(token_session.expires_at - time.time())
                if ttl > 0:
                    self._redis.setex(
                        self._get_redis_key(token),
                        ttl,
                        json.dumps(token_session.to_dict(), ensure_ascii=False)
                    )
            except Exception as e:
                logger.error(f"Redis 更新失败: {e}")
        
        self._fallback_cache[token] = token_session
    
    def _remove_token(self, token: str) -> bool:
        """从存储删除 token"""
        removed = False
        
        if self._redis:
            try:
                removed = self._redis.delete(self._get_redis_key(token)) > 0
            except Exception as e:
                logger.error(f"Redis 删除失败: {e}")
        
        if token in self._fallback_cache:
            del self._fallback_cache[token]
            removed = True
        
        return removed
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        stats = {
            "token_ttl": self._token_ttl,
            "session_ttl": self._session_ttl,
            "redis_connected": self._redis is not None,
            "fallback_cache_size": len(self._fallback_cache),
        }
        
        if self._redis:
            try:
                keys = self._redis.keys("jwxt:token:*")
                stats["active_tokens"] = len(keys)
            except Exception:
                stats["active_tokens"] = "unknown"
        
        return stats


# 全局实例
_token_service: Optional[TokenService] = None


def get_token_service() -> TokenService:
    """获取全局 TokenService 实例"""
    global _token_service
    if _token_service is None:
        _token_service = TokenService()
    return _token_service
