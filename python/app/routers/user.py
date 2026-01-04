"""
用户信息路由
"""

import time
import logging
import traceback
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["用户"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/user")
async def user(username: str = Query(...), password: str = Query(...)):
    """获取用户信息"""
    t0 = time.time()
    try:
        client, user_info = auth_service.get_client(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error"), data=user_info)
        
        logger.info(f"[/user] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=user_info)
    except Exception as e:
        logger.error(f"[/user] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
