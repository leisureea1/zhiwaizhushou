"""
学期路由
"""

import time
import logging
import traceback
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["学期"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/semester")
async def semester(username: str = Query(...), password: str = Query(...)):
    """获取学期信息"""
    t0 = time.time()
    try:
        client, info = auth_service.get_client(username, password)
        if not info.get("success"):
            return make_response(False, error=info.get("error"))
        
        semester_info = client.get_semester_info()
        
        if not semester_info.get("success"):
            # 尝试获取可用学期列表
            avail = client.get_available_semesters()
            if avail.get("success"):
                return make_response(True, data=avail)
            return make_response(False, error=semester_info.get("error"), data=semester_info)
        
        logger.info(f"[/semester] Done in {time.time()-t0:.2f}s")
        return make_response(True, data=semester_info)
    except Exception as e:
        logger.error(f"[/semester] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
