"""
认证相关路由
"""

import time
import logging
import traceback
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["认证"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/login")
async def login(username: str = Query(...), password: str = Query(...)):
    """登录接口"""
    t0 = time.time()
    try:
        result = auth_service.login(username, password)
        logger.info(f"[/login] Completed in {time.time()-t0:.2f}s")
        
        return make_response(
            result.get("success", False),
            data=result if result else None,
            error=result.get("error") if not result.get("success") else None
        )
    except Exception as e:
        logger.error(f"[/login] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
