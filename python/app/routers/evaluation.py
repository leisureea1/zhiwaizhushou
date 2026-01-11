"""
评教路由
"""

import time
import logging
import traceback
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService
from ..core.evaluation import EvaluationService

router = APIRouter(tags=["评教"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/evaluation/pending")
async def get_pending_evaluations(
    username: str = Query(..., description="学号"),
    password: str = Query(..., description="密码")
):
    """
    获取待评教课程列表
    
    返回所有待评教的课程信息，包括课程名称、教师姓名等
    """
    t0 = time.time()
    try:
        client, user_info = auth_service.get_client(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error", "登录失败"))
        
        eval_service = EvaluationService(client.session)
        result = eval_service.get_pending_evaluations()
        
        logger.info(f"[/evaluation/pending] Done in {time.time()-t0:.2f}s")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/pending] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@router.get("/evaluation/submit")
async def submit_evaluation(
    username: str = Query(..., description="学号"),
    password: str = Query(..., description="密码"),
    lesson_id: str = Query(..., description="课程评教ID"),
    choice: int = Query(0, ge=0, le=4, description="评价选项: 0=完全符合, 1=符合, 2=基本符合, 3=基本不符合, 4=完全不符合"),
    comment: str = Query("无", description="意见建议")
):
    """
    提交单个课程评教
    
    对指定课程进行评教，需要提供 lesson_id（可从 pending 接口获取）
    """
    t0 = time.time()
    try:
        client, user_info = auth_service.get_client(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error", "登录失败"))
        
        eval_service = EvaluationService(client.session)
        result = eval_service.evaluate_single(lesson_id, choice, comment)
        
        logger.info(f"[/evaluation/submit] Done in {time.time()-t0:.2f}s")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/submit] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@router.get("/evaluation/auto")
async def auto_evaluate_all(
    username: str = Query(..., description="学号"),
    password: str = Query(..., description="密码"),
    choice: int = Query(0, ge=0, le=4, description="评价选项: 0=完全符合, 1=符合, 2=基本符合, 3=基本不符合, 4=完全不符合"),
    comment: str = Query("无", description="意见建议")
):
    """
    自动评教所有待评课程
    
    一键评教所有待评课程，默认选择"完全符合"(100分)
    
    返回每门课程的评教结果详情
    """
    t0 = time.time()
    try:
        client, user_info = auth_service.get_client(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error", "登录失败"))
        
        eval_service = EvaluationService(client.session)
        result = eval_service.evaluate_all(choice, comment)
        
        logger.info(f"[/evaluation/auto] Done in {time.time()-t0:.2f}s, {result.get('succeeded', 0)}/{result.get('total', 0)} succeeded")
        
        if result.get("success"):
            return make_response(True, data=result)
        else:
            return make_response(False, error=result.get("error"))
    except Exception as e:
        logger.error(f"[/evaluation/auto] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
