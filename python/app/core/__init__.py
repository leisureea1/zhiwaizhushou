"""
核心爬虫模块
"""

from .auth import CASAuth, AuthError
from .course import CourseService
from .grade import GradeService
from .semester import SemesterService
from .user import UserService
from .exam import ExamService
from .jwxt import JwxtClient

__all__ = [
    "CASAuth", "AuthError",
    "CourseService", "GradeService", 
    "SemesterService", "UserService",
    "ExamService", "JwxtClient"
]
