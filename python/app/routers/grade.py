"""
成绩路由 - Token 认证模式
"""

import time
import logging
from typing import Optional, Tuple
from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
import requests

from ..services.dependencies import require_auth
from ..core.grade import GradeService

router = APIRouter(tags=["成绩"])
logger = logging.getLogger(__name__)


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/grade")
async def get_grades(
    semester_id: Optional[str] = Query(None, description="学期ID，不传则获取全部"),
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    获取成绩
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        grade_service = GradeService(session)
        grades = grade_service.get_grades(semester_id)
        
        if not grades.get("success"):
            return make_response(False, error=grades.get("error"), data=grades)
        
        logger.info(f"[/grade] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=grades)
        
    except Exception as e:
        logger.error(f"[/grade] Error: {e}")
        return make_response(False, error=str(e))
