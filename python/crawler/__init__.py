"""
西外教务系统API
模块化教务系统接口，支持多用户
"""

__version__ = "1.0.0"
__author__ = "XISU JWXT API Team"

# 导出主要接口
from .jwxt_api import (
    JwxtAPI,
    quick_login,
    get_user_data,
    batch_get_data
)

from .auth import (
    perform_cas_login,
    login_and_get_cookies,
    load_cookies,
    save_cookies,
    AuthError
)

from .semester import (
    get_semester_id,
    get_semester_info,
    get_available_semesters,
    query_semester_calendar,
    SemesterError
)

from .course import (
    get_course_table,
    CourseError
)

from .grade import (
    get_grade_report,
    get_all_grades,
    get_grade_summary,
    GradeError
)

from .user_info import (
    get_user_info,
    get_student_id,
    get_student_detail,
    get_current_week_and_semester
)

__all__ = [
    # API类
    "JwxtAPI",
    # 便捷函数
    "quick_login",
    "get_user_data",
    "batch_get_data",
    # 认证
    "perform_cas_login",
    "login_and_get_cookies",
    "load_cookies",
    "save_cookies",
    "AuthError",
    # 学期
    "get_semester_id",
    "get_semester_info",
    "get_available_semesters",
    "query_semester_calendar",
    "SemesterError",
    # 课程
    "get_course_table",
    "CourseError",
    # 成绩
    "get_grade_report",
    "get_all_grades",
    "get_grade_summary",
    "GradeError",
    # 用户信息
    "get_user_info",
    "get_student_id",
    "get_student_detail",
    "get_current_week_and_semester",
]
