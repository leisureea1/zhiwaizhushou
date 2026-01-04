"""
教务系统客户端 - 统一接口
"""

from typing import Dict, Optional
import requests

from .auth import CASAuth, AuthError
from .user import UserService
from .semester import SemesterService
from .course import CourseService
from .grade import GradeService
from .exam import ExamService


class JwxtClient:
    """教务系统客户端"""
    
    def __init__(self):
        self.session: Optional[requests.Session] = None
        self.username: Optional[str] = None
        self._auth = CASAuth()
    
    def login(self, username: str, password: str) -> Dict:
        """登录"""
        try:
            self.session = self._auth.login(username, password)
            self.username = username
            return {"success": True, "message": "登录成功"}
        except AuthError as e:
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"登录失败: {e}"}
    
    def _ensure_session(self) -> bool:
        return self.session is not None
    
    def get_user_info(self) -> Dict:
        """获取用户信息"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        service = UserService(self.session)
        return service.get_info()
    
    def get_semester_info(self) -> Dict:
        """获取学期信息"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        service = SemesterService(self.session)
        return service.get_info()
    
    def get_available_semesters(self) -> Dict:
        """获取可用学期列表"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        service = SemesterService(self.session)
        return service.get_available()
    
    def get_course_table(self, semester_id: str = None, student_id: str = None) -> Dict:
        """获取课程表"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        # 获取学期 ID
        if not semester_id:
            sem_service = SemesterService(self.session)
            semester_id = sem_service.get_current_id() or "209"
        
        # 获取学生 ID
        if not student_id:
            user_service = UserService(self.session)
            student_id = user_service.get_student_id()
        
        if not student_id:
            return {"success": False, "error": "无法获取学生 ID"}
        
        service = CourseService(self.session)
        return service.get_table(semester_id, student_id)
    
    def get_grades(self, semester_id: str = None) -> Dict:
        """获取成绩"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        service = GradeService(self.session)
        return service.get_grades(semester_id)
    
    def get_exams(self, semester_id: str = None) -> Dict:
        """获取考试安排"""
        if not self._ensure_session():
            return {"success": False, "error": "未登录"}
        
        service = ExamService(self.session)
        return service.get_exams(semester_id)
