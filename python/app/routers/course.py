"""
课程表路由 - Token 认证模式
"""

import time
import logging
from typing import Optional, Tuple
from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
import requests

from ..services.dependencies import require_auth
from ..core.course import CourseService
from ..core.semester import SemesterService
from ..core.user import UserService

router = APIRouter(tags=["课程"])
logger = logging.getLogger(__name__)


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/course")
async def get_course_table(
    semester_id: Optional[str] = Query(None, description="学期ID，不传则使用当前学期"),
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    获取课程表
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        # 获取学期 ID
        sem_service = SemesterService(session)
        if not semester_id:
            # 优先从 Cookie/页面获取当前学期
            semester_id = sem_service.get_current_id()
            
            # 如果仍然没有，尝试从学期列表获取最新的
            if not semester_id:
                available = sem_service.get_available()
                if available.get("success") and available.get("semesters"):
                    # 学期列表已按倒序排列，第一个就是最新的
                    semester_id = available["semesters"][0].get("id")
                    logger.info(f"[/course] Using latest semester from list: {semester_id}")
            
            if not semester_id:
                return make_response(False, error="无法获取当前学期ID，请稍后重试")
        
        # 获取学生 ID
        student_id = user_info.get("student_id")
        if not student_id:
            user_service = UserService(session)
            student_id = user_service.get_student_id()
        
        if not student_id:
            return make_response(False, error="无法获取学生ID")
        
        # 获取课程表
        course_service = CourseService(session)
        course_table = course_service.get_table(semester_id, student_id)
        
        if not course_table.get("success"):
            return make_response(False, error=course_table.get("error"), data=course_table)
        
        logger.info(f"[/course] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=course_table)
        
    except Exception as e:
        logger.error(f"[/course] Error: {e}")
        return make_response(False, error=str(e))
