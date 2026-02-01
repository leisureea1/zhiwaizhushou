"""
评教路由 - Token 认证模式
"""

import time
import logging
from typing import Optional, Tuple
from fastapi import APIRouter, Query, Depends, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests

from ..services.dependencies import require_auth
from ..core.evaluation import EvaluationService

router = APIRouter(tags=["评教"])
logger = logging.getLogger(__name__)


class EvaluationSubmitRequest(BaseModel):
    lesson_id: str
    choice: int = 0
    comment: str = "无"


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/evaluation/pending")
async def get_pending_evaluations(
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    获取待评教课程列表
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        eval_service = EvaluationService(session)
        result = eval_service.get_pending_evaluations()
        
        logger.info(f"[/evaluation/pending] Done in {time.time()-t0:.2f}s")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/pending] Error: {e}")
        return make_response(False, error=str(e))


@router.post("/evaluation/submit/{evaluation_id}")
async def submit_evaluation(
    evaluation_id: str,
    request: EvaluationSubmitRequest = Body(...),
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    提交单个课程评教
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        eval_service = EvaluationService(session)
        result = eval_service.evaluate_single(evaluation_id, request.choice, request.comment)
        
        logger.info(f"[/evaluation/submit] Done in {time.time()-t0:.2f}s")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/submit] Error: {e}")
        return make_response(False, error=str(e))


@router.post("/evaluation/auto")
async def auto_evaluate_all(
    choice: int = Query(0, ge=0, le=4, description="评价选项"),
    comment: str = Query("无", description="意见建议"),
    auth: Tuple[requests.Session, dict, str] = Depends(require_auth)
):
    """
    自动评教所有待评课程
    
    需要 Authorization: Bearer <token> 认证
    """
    session, user_info, token = auth
    t0 = time.time()
    
    try:
        eval_service = EvaluationService(session)
        result = eval_service.evaluate_all(choice, comment)
        
        logger.info(f"[/evaluation/auto] Done in {time.time()-t0:.2f}s, {result.get('succeeded', 0)}/{result.get('total', 0)} succeeded")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/auto] Error: {e}")
        return make_response(False, error=str(e))
