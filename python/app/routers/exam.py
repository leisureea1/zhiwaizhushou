"""
考试路由 - Token 认证模式
"""

import time
import logging
from typing import Optional, Tuple
from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
import requests

from ..services.dependencies import require_auth
from ..core.exam import ExamService

router = APIRouter(tags=["考试"])
logger = logging.getLogger(__name__)


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/exam")
async def get_exams(
    semester_id: Optional[str] = Query(None, description="学期ID"),
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    获取考试安排
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        exam_service = ExamService(session)
        exams = exam_service.get_exams(semester_id)
        
        if not exams.get("success"):
            return make_response(False, error=exams.get("error"), data=exams)
        
        logger.info(f"[/exam] Done in {time.time()-t0:.2f}s, found {exams.get('total', 0)} exams")
        return make_response(True, data=exams)
        
    except Exception as e:
        logger.error(f"[/exam] Error: {e}")
        return make_response(False, error=str(e))
