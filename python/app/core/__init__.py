"""
核心爬虫模块
"""

from .auth import CASAuth, AuthError
from .course import CourseService
from .grade import GradeService
from .semester import SemesterService
from .user import UserService
from .jwxt import JwxtClient

__all__ = [
    "CASAuth", "AuthError",
    "CourseService", "GradeService", 
    "SemesterService", "UserService",
    "JwxtClient"
]
