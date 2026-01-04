"""
API 路由
"""

from .auth import router as auth_router
from .course import router as course_router
from .grade import router as grade_router
from .semester import router as semester_router
from .user import router as user_router
from .cache import router as cache_router

__all__ = [
    "auth_router",
    "course_router", 
    "grade_router",
    "semester_router",
    "user_router",
    "cache_router"
]
