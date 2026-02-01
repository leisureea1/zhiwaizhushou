"""
共享依赖项

提供 Token 认证等通用依赖
"""

import logging
from typing import Optional, Tuple
from fastapi import Header, HTTPException, Depends
import requests

from .token_service import get_token_service, TokenService

logger = logging.getLogger(__name__)


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """从 Authorization header 提取 token"""
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


async def require_auth(
    authorization: Optional[str] = Header(None),
) -> Tuple[requests.Session, dict, str]:
    """
    依赖注入：要求认证，返回会话和用户信息
    
    Usage:
        @router.get("/xxx")
        async def xxx(auth: Tuple = Depends(require_auth)):
            session, user_info, token = auth
            ...
    
    Returns:
        (session, user_info, token) 元组
    
    Raises:
        HTTPException 401: token 无效或过期
    """
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=401, 
            detail={"code": "NO_TOKEN", "message": "未提供认证令牌"}
        )
    
    token_service = get_token_service()
    result = token_service.get_session(token)
    
    if not result:
        raise HTTPException(
            status_code=401, 
            detail={"code": "TOKEN_EXPIRED", "message": "令牌无效或已过期"}
        )
    
    session, user_info = result
    return session, user_info, token


async def optional_auth(
    authorization: Optional[str] = Header(None),
) -> Optional[Tuple[requests.Session, dict, str]]:
    """
    可选认证，不抛异常
    """
    token = get_token_from_header(authorization)
    if not token:
        return None
    
    token_service = get_token_service()
    result = token_service.get_session(token)
    
    if not result:
        return None
    
    session, user_info = result
    return session, user_info, token
