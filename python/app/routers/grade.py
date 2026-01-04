"""
成绩路由
"""

import time
import logging
import traceback
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["成绩"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/grade")
async def grade(
    username: str = Query(...),
    password: str = Query(...),
    semester_id: Optional[str] = Query(None)
):
    """获取成绩"""
    t0 = time.time()
    try:
        client, info = auth_service.get_client(username, password)
        if not info.get("success"):
            return make_response(False, error=info.get("error"))
        
        grades = client.get_grades(semester_id)
        
        # 会话失效重试
        if not grades.get("success") and auth_service.looks_like_session_invalid(grades):
            logger.warning("[/grade] Session expired, retry...")
            auth_service.invalidate(username, password)
            client, _ = auth_service.get_client(username, password)
            grades = client.get_grades(semester_id)
        
        if not grades.get("success"):
            return make_response(False, error=grades.get("error"), data=grades)
        
        logger.info(f"[/grade] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=grades)
    except Exception as e:
        logger.error(f"[/grade] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
