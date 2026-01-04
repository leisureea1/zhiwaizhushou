"""
课程表路由
"""

import time
import logging
import traceback
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["课程"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/course")
async def course(
    username: str = Query(...),
    password: str = Query(...),
    semester_id: Optional[str] = Query(None)
):
    """获取课程表"""
    t0 = time.time()
    try:
        client, user_info = auth_service.get_client(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error", "无法获取用户信息"))
        
        course_table = client.get_course_table(semester_id, user_info.get("student_id"))
        
        # 会话失效重试
        if not course_table.get("success") and auth_service.looks_like_session_invalid(course_table):
            logger.warning("[/course] Session expired, retry...")
            auth_service.invalidate(username, password)
            client, user_info = auth_service.get_client(username, password)
            if user_info.get("success"):
                course_table = client.get_course_table(semester_id, user_info.get("student_id"))
        
        if not course_table.get("success"):
            return make_response(False, error=course_table.get("error"), data=course_table)
        
        logger.info(f"[/course] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=course_table)
    except Exception as e:
        logger.error(f"[/course] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
