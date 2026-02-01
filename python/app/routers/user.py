"""
用户信息路由 - Token 认证模式
"""

import time
import logging
from typing import Tuple
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
import requests

from ..services.dependencies import require_auth
from ..core.user import UserService

router = APIRouter(tags=["用户"])
logger = logging.getLogger(__name__)


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/user")
async def get_user_info(auth: Tuple[requests.Session, dict, str] = Depends(require_auth)):
    """
    获取用户信息
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        # 如果缓存的 user_info 已包含完整信息，直接返回
        if user_info.get("name") and user_info.get("student_id"):
            logger.info(f"[/user] Returned cached info in {time.time()-t0:.4f}s")
            return make_response(True, data=user_info)
        
        # 否则重新获取
        user_service = UserService(session)
        fresh_info = user_service.get_info()
        
        logger.info(f"[/user] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=fresh_info)
        
    except Exception as e:
        logger.error(f"[/user] Error: {e}")
        return make_response(False, error=str(e))
