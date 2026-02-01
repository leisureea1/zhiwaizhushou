"""
学期路由 - Token 认证模式
"""

import time
import logging
from typing import Tuple
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
import requests

from ..services.dependencies import require_auth
from ..core.semester import SemesterService

router = APIRouter(tags=["学期"])
logger = logging.getLogger(__name__)


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/semester")
async def get_semester_info(
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    获取学期信息
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        semester_service = SemesterService(session)
        semester_info = semester_service.get_info()
        
        if not semester_info.get("success"):
            avail = semester_service.get_available()
            if avail.get("success"):
                return make_response(True, data=avail)
            return make_response(False, error=semester_info.get("error"), data=semester_info)
        
        logger.info(f"[/semester] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=semester_info)
        
    except Exception as e:
        logger.error(f"[/semester] Error: {e}")
        return make_response(False, error=str(e))
