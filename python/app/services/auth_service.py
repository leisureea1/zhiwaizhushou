"""
认证服务
"""

import logging
from typing import Tuple, Dict

from ..core import JwxtClient, AuthError
from .session_cache import get_session_cache

logger = logging.getLogger(__name__)

LOGIN_ERROR_KEYWORDS = ["登录", "统一身份认证", "未登录", "会话过期", "session", "expired"]


class AuthService:
    """认证服务"""
    
    def __init__(self):
        self.cache = get_session_cache()
    
    def looks_like_session_invalid(self, result: dict) -> bool:
        """判断是否会话失效"""
        if not isinstance(result, dict) or result.get("success"):
            return False
        err = (result.get("error") or "").lower()
        return any(k.lower() in err for k in LOGIN_ERROR_KEYWORDS)
    
    def _validate_session(self, client: JwxtClient) -> dict:
        """校验会话"""
        try:
            info = client.get_user_info()
            if not info.get("success"):
                return info
            if not info.get("student_id"):
                return {"success": False, "error": "会话可能已过期"}
            return info
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_client(self, username: str, password: str) -> Tuple[JwxtClient, dict]:
        """获取已验证的客户端"""
        client = JwxtClient()
        
        # 尝试缓存
        cached = self.cache.get(username, password)
        if cached:
            logger.info(f"[auth] Cache HIT: {username}")
            client.session = cached
            client.username = username
            info = self._validate_session(client)
            if info.get("success"):
                return client, info
            logger.warning(f"[auth] Cached session invalid: {username}")
        
        # 登录
        logger.info(f"[auth] Login: {username}")
        result = client.login(username, password)
        if not result.get("success"):
            return client, result
        
        # 缓存
        if client.session:
            self.cache.set(username, password, client.session)
        
        info = self._validate_session(client)
        return client, info
    
    def login(self, username: str, password: str) -> Dict:
        """登录"""
        if self.cache.get(username, password):
            return {"success": True, "message": "登录成功（缓存）"}
        
        client = JwxtClient()
        result = client.login(username, password)
        
        if result.get("success") and client.session:
            self.cache.set(username, password, client.session)
        
        return result
    
    def invalidate(self, username: str, password: str):
        """使会话失效"""
        self.cache.remove(username, password)
