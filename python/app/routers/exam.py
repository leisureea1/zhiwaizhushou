"""
考试信息路由
"""

import time
import logging
import traceback
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..services.auth_service import AuthService

router = APIRouter(tags=["考试"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@router.get("/exam")
async def exam(
    username: str = Query(...),
    password: str = Query(...),
    semester_id: Optional[str] = Query(None)
):
    """获取考试安排"""
    t0 = time.time()
    try:
        client, info = auth_service.get_client(username, password)
        if not info.get("success"):
            return make_response(False, error=info.get("error"))
        
        exams = client.get_exams(semester_id)
        
        # 会话失效重试
        if not exams.get("success") and auth_service.looks_like_session_invalid(exams):
            logger.warning("[/exam] Session expired, retry...")
            auth_service.invalidate(username, password)
            client, _ = auth_service.get_client(username, password)
            exams = client.get_exams(semester_id)
        
        if not exams.get("success"):
            return make_response(False, error=exams.get("error"), data=exams)
        
        logger.info(f"[/exam] Done in {time.time()-t0:.2f}s, found {exams.get('total', 0)} exams")
        return make_response(True, data=exams)
    except Exception as e:
        logger.error(f"[/exam] Error: {e}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@router.get("/exam/debug")
async def exam_debug(
    username: str = Query(...),
    password: str = Query(...),
    semester_id: Optional[str] = Query(None)
):
    """调试：查看考试页面原始数据"""
    from bs4 import BeautifulSoup
    
    try:
        client, info = auth_service.get_client(username, password)
        if not info.get("success"):
            return make_response(False, error=info.get("error"))
        
        session = client.session
        url = "https://jwxt.xisu.edu.cn/eams/stdExamTable!examTable.action"
        
        params = {}
        if semester_id:
            params['semester.id'] = semester_id
        
        resp = session.get(url, params=params, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # 查找所有表格
        tables_info = []
        for i, table in enumerate(soup.find_all("table")):
            headers = [th.get_text(strip=True) for th in table.find_all("th")]
            rows = []
            for row in table.find_all("tr"):
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if cells:
                    rows.append(cells)
            tables_info.append({
                "index": i,
                "headers": headers,
                "rows": rows[:5],  # 只取前5行
                "total_rows": len(rows)
            })
        
        return make_response(True, data={
            "url": url,
            "params": params,
            "status": resp.status_code,
            "tables": tables_info,
            "html_snippet": resp.text[:2000]
        })
    except Exception as e:
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
