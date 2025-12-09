#!/usr/bin/env python3
"""
教务系统统一API接口
提供给前端调用的高层接口，支持多用户
"""

from typing import Dict, Optional, List
from pathlib import Path
import json

from .auth import login_and_get_cookies, load_cookies, AuthError
from .semester import get_semester_info, get_available_semesters
from .course import get_course_table
from .grade import get_grade_report, get_all_grades, get_grade_summary
from .user_info import get_user_info as _get_user_info


class JwxtAPI:
    """教务系统API类"""
    
    def __init__(self, username: str = None, password: str = None, cookie_file: str = None):
        """
        初始化API
        
        Args:
            username: 学号（可选）
            password: 密码（可选）
            cookie_file: Cookie文件路径（可选）
        """
        self.username = username
        self.password = password
        self.cookie_file = cookie_file
        self.session = None
    
    def login(self, username: str = None, password: str = None, save_cookie: bool = True) -> Dict:
        """
        登录教务系统
        
        Args:
            username: 学号
            password: 密码
            save_cookie: 是否保存cookie
            
        Returns:
            登录结果字典
        """
        username = username or self.username
        password = password or self.password
        
        if not username or not password:
            return {
                "success": False,
                "error": "缺少用户名或密码"
            }
        
        save_path = None
        if save_cookie:
            if not self.cookie_file:
                self.cookie_file = f"cookies_{username}.json"
            save_path = self.cookie_file
        
        result = login_and_get_cookies(username, password, save_path)
        
        if result.get("success"):
            self.session = result.get("session")
            self.username = username
        
        return result
    
    def load_session(self, cookie_file: str = None) -> Dict:
        """
        从cookie文件加载session
        
        Args:
            cookie_file: Cookie文件路径
            
        Returns:
            加载结果字典
        """
        cookie_file = cookie_file or self.cookie_file
        
        if not cookie_file:
            return {
                "success": False,
                "error": "未指定cookie文件"
            }
        
        try:
            self.session = load_cookies(cookie_file)
            self.cookie_file = cookie_file
            return {
                "success": True,
                "message": "Session加载成功"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def ensure_session(self) -> bool:
        """确保有有效的session"""
        return self.session is not None
    
    def get_semester_info(self) -> Dict:
        """
        获取学期信息
        
        Returns:
            学期信息字典
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        return get_semester_info(self.session)
    
    def get_available_semesters(self) -> Dict:
        """
        获取所有可用的学期列表（推荐前端首先调用此接口）
        
        Returns:
            包含可用学期列表的字典，格式:
            {
                "success": True,
                "semesters": [
                    {"id": "209", "name": "2024-2025学年第2学期", "current": True},
                    {"id": "169", "name": "2024-2025学年第1学期"},
                    ...
                ],
                "current_semester": "209",
                "message": "找到 X 个学期"
            }
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        return get_available_semesters(self.session)
    
    def get_course_table(self, semester_id: str = None, student_id: str = None) -> Dict:
        """
        获取课程表
        
        Args:
            semester_id: 学期ID（可选）
            student_id: 学生ID（可选，如果为None则自动获取）
            
        Returns:
            课程表字典
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        return get_course_table(self.session, semester_id, student_id)
    
    def get_grades(self, semester_id: str = None, summary: bool = False) -> Dict:
        """
        获取成绩
        
        Args:
            semester_id: 学期ID（可选）
            summary: 是否返回摘要版
            
        Returns:
            成绩字典
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        if summary:
            return get_grade_summary(self.session, semester_id)
        else:
            return get_grade_report(self.session, semester_id)
    
    def get_all_grades(self, semester_ids: List[str] = None) -> Dict:
        """
        获取多学期成绩
        
        Args:
            semester_ids: 学期ID列表（可选）
            
        Returns:
            多学期成绩字典
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        return get_all_grades(self.session, semester_ids)
    
    def get_user_info(self) -> Dict:
        """
        获取当前登录用户的完整信息
        包括：学生ID、姓名、院系、专业、班级、年级、当前周次、当前学期等
        
        Returns:
            包含用户完整信息的字典，格式:
            {
                "success": True,
                "student_id": "122519",
                "name": "张三",
                "department": "英语学院",
                "major": "英语语言文学",
                "class_name": "英语2401班",
                "grade": "2024",
                "current_week": 5,
                "current_semester": "209",
                "semester_name": "2024-2025学年第2学期"
            }
        """
        if not self.ensure_session():
            return {"success": False, "error": "未登录"}
        
        return _get_user_info(self.session)


# 便捷函数（无需创建API对象）

def quick_login(username: str, password: str) -> Dict:
    """
    快速登录
    
    Args:
        username: 学号
        password: 密码
        
    Returns:
        登录结果，包含session信息
    """
    return login_and_get_cookies(username, password)


def get_user_data(username: str, password: str, data_type: str = "all") -> Dict:
    """
    一键获取用户所有数据
    
    Args:
        username: 学号
        password: 密码
        data_type: 数据类型 ("all", "course", "grade", "semester")
        
    Returns:
        包含请求数据的字典
    """
    api = JwxtAPI()
    
    # 登录
    login_result = api.login(username, password, save_cookie=False)
    if not login_result.get("success"):
        return {
            "success": False,
            "error": f"登录失败: {login_result.get('error')}"
        }
    
    result = {
        "success": True,
        "username": username
    }
    
    # 获取学期信息
    if data_type in ["all", "semester"]:
        semester_info = api.get_semester_info()
        result["semester_info"] = semester_info
        current_semester_id = semester_info.get("current_semester_id")
    else:
        current_semester_id = None
    
    # 获取课程表
    if data_type in ["all", "course"]:
        # 先获取用户信息以获取学生ID
        user_info = api.get_user_info()
        student_id = user_info.get("student_id") if user_info.get("success") else None
        
        course_table = api.get_course_table(current_semester_id, student_id)
        result["course_table"] = course_table
    
    # 获取成绩
    if data_type in ["all", "grade"]:
        grades = api.get_grades(current_semester_id, summary=False)
        result["grades"] = grades
    
    return result


def batch_get_data(users: List[Dict], data_type: str = "all") -> List[Dict]:
    """
    批量获取多个用户的数据
    
    Args:
        users: 用户列表，每个元素为 {"username": "学号", "password": "密码"}
        data_type: 数据类型
        
    Returns:
        结果列表
    """
    results = []
    
    for user in users:
        username = user.get("username")
        password = user.get("password")
        
        if not username or not password:
            results.append({
                "success": False,
                "username": username,
                "error": "缺少用户名或密码"
            })
            continue
        
        try:
            user_data = get_user_data(username, password, data_type)
            results.append(user_data)
        except Exception as e:
            results.append({
                "success": False,
                "username": username,
                "error": str(e)
            })
    
    return results


# 命令行接口示例
def main():
    """命令行接口示例"""
    import argparse
    
    parser = argparse.ArgumentParser(description="西外教务系统API")
    parser.add_argument("--username", required=True, help="学号")
    parser.add_argument("--password", required=True, help="密码")
    parser.add_argument("--action", choices=["login", "course", "grade", "semester", "all"],
                       default="all", help="操作类型")
    parser.add_argument("--output", help="输出JSON文件路径")
    parser.add_argument("--simple", action="store_true", help="使用简化格式")
    
    args = parser.parse_args()
    
    # 创建API实例
    api = JwxtAPI()
    
    # 登录
    print(f"正在登录用户: {args.username}...")
    login_result = api.login(args.username, args.password)
    
    if not login_result.get("success"):
        print(f"登录失败: {login_result.get('error')}")
        return
    
    print("登录成功!")
    
    result = {"username": args.username}
    
    # 根据action执行操作
    if args.action in ["all", "semester"]:
        print("获取学期信息...")
        semester_info = api.get_semester_info()
        result["semester_info"] = semester_info
        if semester_info.get("success"):
            print(f"当前学期ID: {semester_info.get('current_semester_id')}")
    
    if args.action in ["all", "course"]:
        print("获取课程表...")
        course_table = api.get_course_table()
        result["course_table"] = course_table
        if course_table.get("success"):
            print(f"课程数量: {course_table.get('total_courses')}")
    
    if args.action in ["all", "grade"]:
        print("获取成绩...")
        grades = api.get_grades(summary=args.simple)
        result["grades"] = grades
        if grades.get("success"):
            print(f"成绩数量: {grades.get('total_courses')}")
    
    # 输出结果
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"结果已保存到: {output_path.resolve()}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
