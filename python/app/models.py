"""
数据模型定义
"""

from typing import Optional, Any
from pydantic import BaseModel


class APIResponse(BaseModel):
    """统一 API 响应格式"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


class LoginRequest(BaseModel):
    """登录请求"""
    username: str
    password: str


class CourseRequest(BaseModel):
    """课程查询请求"""
    username: str
    password: str
    semester_id: Optional[str] = None


class GradeRequest(BaseModel):
    """成绩查询请求"""
    username: str
    password: str
    semester_id: Optional[str] = None


class SemesterRequest(BaseModel):
    """学期查询请求"""
    username: str
    password: str


class UserRequest(BaseModel):
    """用户信息请求"""
    username: str
    password: str
