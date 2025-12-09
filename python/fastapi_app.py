#!/usr/bin/env python3
"""
FastAPI wrapper for JwxtAPI

提供以下 GET 接口：
  - /login
  - /course
  - /grade
  - /semester
  - /user

所有接口通过 GET 参数接收 `username`, `password`, `semester_id`（可选）。

统一返回 JSON 格式：
{
  "success": true|false,
  "error": "错误信息（可选）",
  "data": {...}    # 可选，根据接口返回
}

示例 uvicorn 启动命令:
    uvicorn python.fastapi_app:app --host 0.0.0.0 --port 8000 --workers 1

PHP 调用示例（使用 file_get_contents）：
    $username = '学号';
    $password = '密码';
    $url = 'http://127.0.0.1:8000/course?username='.urlencode($username).'&password='.urlencode($password).'&semester_id=209';
    $resp = file_get_contents($url);
    $data = json_decode($resp, true);

注意：长期运行服务请使用进程管理器（systemd/supervisor/docker等）来保证可靠性。
"""

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from typing import Optional
import traceback
import sys
import time
from pathlib import Path

# 确保可以导入 crawler 模块
sys.path.insert(0, str(Path(__file__).parent))

from crawler.jwxt_api import JwxtAPI
from session_cache import get_session_cache
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="XISU JwxtAPI Service")

# 全局 Session 缓存
session_cache = get_session_cache()


# ---------- 会话校验与自动续期辅助函数 ----------
LOGIN_ERROR_KEYWORDS = [
    "登录", "统一身份认证", "未登录", "请确认已登录", "会话过期", "session", "expired"
]


def _looks_like_session_invalid(result: dict) -> bool:
    """根据返回内容判断是否可能是会话失效。
    规则：success=False 且 error 中包含常见登录/过期关键词。
    """
    if not isinstance(result, dict):
        return False
    if result.get("success") is True:
        return False
    err = (result.get("error") or "").lower()
    # 统一用小写比较
    return any(k.lower() in err for k in LOGIN_ERROR_KEYWORDS)


def _validate_session(api: JwxtAPI) -> dict:
    """用轻量接口校验当前 session 是否有效。
    优先使用 get_user_info（同时拿到 student_id），失败则返回具体错误。
    返回：user_info(dict)
    """
    try:
        info = api.get_user_info()
        # 若未获取到 student_id，也视为会话无效（很多情况下是被重定向至登录页导致解析不到 ids）
        if not info.get("success"):
            return info
        if not info.get("student_id"):
            return {"success": False, "error": "未获取到 student_id，会话可能已过期或未登录"}
        return info
    except Exception as e:
        return {"success": False, "error": f"validate error: {e}"}


def _get_api_with_valid_session(username: str, password: str) -> tuple[JwxtAPI, dict]:
    """获取已验证的 API 实例与 user_info。
    流程：
      1) 读取缓存 session -> 校验 -> 成功则返回
      2) 失败则登录 -> 写缓存 -> 再次校验 -> 返回
    可能抛出异常，在上层捕获。
    """
    api = JwxtAPI()

    # 先尝试缓存
    cached = session_cache.get(username, password)
    if cached is not None:
        logger.info(f"[auth] Cache HIT for {username}, validating session...")
        api.session = cached
        api.username = username
        info = _validate_session(api)
        if info.get("success"):
            return api, info
        logger.warning(f"[auth] Cached session invalid for {username}, will re-login. error={info.get('error')}")

    # 登录并缓存
    logger.info(f"[auth] Logging in for {username} ...")
    login_result = api.login(username=username, password=password, save_cookie=False)
    if not login_result.get("success"):
        # 登录失败，直接返回错误信息
        return api, {"success": False, "error": login_result.get("error")}

    # 写缓存
    if api.session:
        session_cache.set(username, password, api.session)
        logger.info(f"[auth] Session cached for {username}")
    else:
        logger.warning(f"[auth] Login success but no session object for {username}")

    # 再次校验
    info = _validate_session(api)
    return api, info


def make_response(success: bool, data: Optional[dict] = None, error: Optional[str] = None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload["data"] = data
    return JSONResponse(content=payload)


@app.get("/login")
async def login(username: str = Query(...), password: str = Query(...)):
    """登录并返回登录结果（不保存cookie除非JwxtAPI内部处理）"""
    t0 = time.time()
    try:
        # 检查缓存
        cached_session = session_cache.get(username, password)
        
        if cached_session is not None:
            logger.info(f"[/login] Cache HIT for user {username}, took {time.time()-t0:.2f}s")
            return make_response(True, data={"success": True, "message": "登录成功（使用缓存）"})
        
        # 缓存未命中，执行登录
        logger.info(f"[/login] Cache MISS for user {username}, performing login...")
        api = JwxtAPI()
        result = api.login(username=username, password=password, save_cookie=False)
        
        # 登录成功，缓存 session
        if result.get("success") and api.session:
            session_cache.set(username, password, api.session)
            logger.info(f"[/login] Login success, session cached for {username}")
        
        elapsed = time.time() - t0
        logger.info(f"[/login] Completed in {elapsed:.2f}s")
        
        return make_response(result.get("success", False), data=result if result else None, error=result.get("error") if not result.get("success") else None)
    except Exception as e:
        logger.error(f"[/login] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@app.get("/course")
async def course(username: str = Query(...), password: str = Query(...), semester_id: Optional[str] = Query(None)):
    """获取课程表。"""
    t0 = time.time()
    try:
        # 1) 获取可用 API（自动校验/自动登录）
        api, user_info = _get_api_with_valid_session(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error", "无法获取用户信息"))

        student_id = user_info.get("student_id")
        
        # 2) 调原始业务接口
        t_course = time.time()
        course_table = api.get_course_table(semester_id, student_id)
        logger.info(f"[/course] Get course table took {time.time()-t_course:.2f}s")

        # 3) 如疑似会话失效，自动重登一次并重试
        if not course_table.get("success") and (
            _looks_like_session_invalid(course_table) or
            "无法确定学生ID" in (course_table.get("error") or "")
        ):
            logger.warning(f"[/course] detected possible session expiry, re-login and retry...")
            session_cache.remove(username, password)
            api, user_info = _get_api_with_valid_session(username, password)
            if not user_info.get("success"):
                return make_response(False, error=user_info.get("error", "无法获取用户信息"))
            student_id = user_info.get("student_id")
            course_table = api.get_course_table(semester_id, student_id)

        if not course_table.get("success"):
            return make_response(False, error=course_table.get("error"), data=course_table)

        elapsed = time.time() - t0
        logger.info(f"[/course] Total request took {elapsed:.2f}s")
        return make_response(True, data=course_table)
    except Exception as e:
        logger.error(f"[/course] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())
        


@app.get("/grade")
async def grade(username: str = Query(...), password: str = Query(...), semester_id: Optional[str] = Query(None)):
    """获取成绩详情（默认返回详细报告）。"""
    t0 = time.time()
    try:
        # 1) 获取可用 API（自动校验/自动登录）
        api, _ = _get_api_with_valid_session(username, password)

        # 2) 业务调用
        t_grade = time.time()
        grades = api.get_grades(semester_id, summary=False)
        logger.info(f"[/grade] Get grades took {time.time()-t_grade:.2f}s")

        # 3) 如疑似会话失效，自动重登一次并重试
        if not grades.get("success") and _looks_like_session_invalid(grades):
            logger.warning(f"[/grade] detected possible session expiry, re-login and retry...")
            session_cache.remove(username, password)
            api, _ = _get_api_with_valid_session(username, password)
            grades = api.get_grades(semester_id, summary=False)

        if not grades.get("success"):
            return make_response(False, error=grades.get("error"), data=grades)

        elapsed = time.time() - t0
        logger.info(f"[/grade] Total request took {elapsed:.2f}s")
        return make_response(True, data=grades)
    except Exception as e:
        logger.error(f"[/grade] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@app.get("/semester")
async def semester(username: str = Query(...), password: str = Query(...)):
    """获取学期信息 / 可用学期列表。"""
    t0 = time.time()
    try:
        # 1) 获取可用 API（自动校验/自动登录）
        api, _ = _get_api_with_valid_session(username, password)

        # 2) 业务调用：优先学期信息
        t_sem = time.time()
        semester_info = api.get_semester_info()
        logger.info(f"[/semester] Get semester info took {time.time()-t_sem:.2f}s")

        # 如失败，尝试可用学期列表
        if not semester_info.get("success"):
            avail = api.get_available_semesters()
            if avail.get("success"):
                elapsed = time.time() - t0
                logger.info(f"[/semester] Total request took {elapsed:.2f}s (fallback avail)")
                return make_response(True, data=avail)

        # 3) 如疑似会话失效，重登并重试
        if not semester_info.get("success") and _looks_like_session_invalid(semester_info):
            logger.warning(f"[/semester] detected possible session expiry, re-login and retry...")
            session_cache.remove(username, password)
            api, _ = _get_api_with_valid_session(username, password)
            semester_info = api.get_semester_info()

        if not semester_info.get("success"):
            # 最后再试一次 avail
            avail = api.get_available_semesters()
            if avail.get("success"):
                elapsed = time.time() - t0
                logger.info(f"[/semester] Total request took {elapsed:.2f}s (fallback avail after retry)")
                return make_response(True, data=avail)
            return make_response(False, error=semester_info.get("error"), data=semester_info)

        elapsed = time.time() - t0
        logger.info(f"[/semester] Total request took {elapsed:.2f}s")
        return make_response(True, data=semester_info)
    except Exception as e:
        logger.error(f"[/semester] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@app.get("/user")
async def user(username: str = Query(...), password: str = Query(...)):
    """获取用户信息（学生ID、姓名等）。"""
    t0 = time.time()
    try:
        # 1) 获取可用 API（自动校验/自动登录）
        api, user_info = _get_api_with_valid_session(username, password)
        if not user_info.get("success"):
            return make_response(False, error=user_info.get("error"), data=user_info)

        elapsed = time.time() - t0
        logger.info(f"[/user] Total request took {elapsed:.2f}s")
        return make_response(True, data=user_info)
    except Exception as e:
        logger.error(f"[/user] Error: {str(e)}")
        return make_response(False, error=str(e) + "\n" + traceback.format_exc())


@app.get("/cache/stats")
async def cache_stats():
    """获取缓存统计信息（调试用）"""
    return session_cache.get_stats()


@app.get("/cache/info")
async def cache_info():
    """获取缓存详细信息（调试用）"""
    return session_cache.get_cache_info()


@app.post("/cache/clear")
async def cache_clear():
    """清空所有缓存"""
    session_cache.clear()
    return {"success": True, "message": "Cache cleared"}
