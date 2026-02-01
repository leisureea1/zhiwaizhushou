"""
认证相关路由 - Token 模式

登录成功后返回 token，后续接口使用 token 认证
"""

import time
import logging
import traceback
from typing import Optional
from fastapi import APIRouter, Query, Header, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..services.auth_service import AuthService
from ..services.token_service import get_token_service, TokenService
from ..core import JwxtClient

router = APIRouter(prefix="/auth", tags=["认证"])
logger = logging.getLogger(__name__)
auth_service = AuthService()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    expires_in: Optional[int] = None
    user_info: Optional[dict] = None
    error: Optional[str] = None


def make_response(success: bool, data=None, error=None):
    payload = {"success": success}
    if error:
        payload["error"] = error
    if data is not None:
        payload.update(data)
    return JSONResponse(content=payload)


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """从 Authorization header 提取 token"""
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


async def get_current_session(
    authorization: Optional[str] = Header(None),
    token_service: TokenService = Depends(get_token_service)
):
    """
    依赖注入：获取当前用户的会话
    
    Returns:
        (session, user_info, token) 元组
    
    Raises:
        HTTPException: token 无效或过期
    """
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    
    result = token_service.get_session(token)
    if not result:
        raise HTTPException(status_code=401, detail="令牌无效或已过期")
    
    session, user_info = result
    return session, user_info, token


@router.post("/login")
async def login(request: LoginRequest):
    """
    登录接口
    
    验证教务系统账号，成功后返回 token
    后续请求使用 Authorization: Bearer <token> 认证
    """
    t0 = time.time()
    try:
        # 使用 JwxtClient 登录并获取用户信息
        client = JwxtClient()
        login_result = client.login(request.username, request.password)
        
        if not login_result.get("success"):
            logger.warning(f"[/auth/login] Login failed for {request.username}")
            return make_response(
                False,
                error=login_result.get("error", "登录失败")
            )
        
        # 获取用户信息
        user_info = client.get_user_info()
        if not user_info.get("success"):
            user_info = {"student_id": request.username}
        
        # 创建 token
        token_service = get_token_service()
        token, expires_in = token_service.create_token(
            username=request.username,
            session=client.session,
            user_info=user_info,
        )
        
        logger.info(f"[/auth/login] Success for {request.username} in {time.time()-t0:.2f}s")
        
        return make_response(
            True,
            data={
                "token": token,
                "expires_in": expires_in,
                "user_info": user_info,
            }
        )
        
    except Exception as e:
        logger.error(f"[/auth/login] Error: {str(e)}")
        return make_response(False, error=str(e))


@router.post("/refresh")
async def refresh_session(
    request: LoginRequest,
    authorization: Optional[str] = Header(None),
):
    """
    刷新会话
    
    当教务系统会话过期时，NestJS 可调用此接口用账号密码重新登录
    并更新 token 对应的会话
    """
    t0 = time.time()
    try:
        token = get_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="未提供认证令牌")
        
        # 重新登录
        client = JwxtClient()
        login_result = client.login(request.username, request.password)
        
        if not login_result.get("success"):
            return make_response(False, error=login_result.get("error", "登录失败"))
        
        # 更新 token 对应的会话
        token_service = get_token_service()
        success = token_service.refresh_token(token, client.session)
        
        if not success:
            # token 不存在，创建新的
            user_info = client.get_user_info()
            new_token, expires_in = token_service.create_token(
                username=request.username,
                session=client.session,
                user_info=user_info if user_info.get("success") else {},
            )
            logger.info(f"[/auth/refresh] Created new token for {request.username}")
            return make_response(True, data={"token": new_token, "expires_in": expires_in})
        
        logger.info(f"[/auth/refresh] Success for {request.username} in {time.time()-t0:.2f}s")
        return make_response(True, data={"message": "会话已刷新"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[/auth/refresh] Error: {str(e)}")
        return make_response(False, error=str(e))


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """登出，使 token 失效"""
    token = get_token_from_header(authorization)
    if token:
        token_service = get_token_service()
        token_service.invalidate_token(token)
    return make_response(True, data={"message": "已登出"})


@router.get("/validate")
async def validate_token(authorization: Optional[str] = Header(None)):
    """验证 token 是否有效"""
    token = get_token_from_header(authorization)
    if not token:
        return make_response(False, data={"valid": False}, error="未提供令牌")
    
    token_service = get_token_service()
    result = token_service.get_session(token)
    
    if result:
        _, user_info = result
        return make_response(True, data={"valid": True, "user_info": user_info})
    
    return make_response(False, data={"valid": False}, error="令牌无效或已过期")
