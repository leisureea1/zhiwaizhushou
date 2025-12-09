#!/usr/bin/env python3
"""
用户信息模块 - 获取当前登录用户的信息
"""

import re
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup


def get_current_week_and_semester(session: requests.Session) -> Dict:
    """
    从首页获取当前教学周和学期信息
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        包含当前周次和学期信息的字典
    """
    try:
        resp = session.get(
            "https://jwxt.xisu.edu.cn/eams/home!welcome.action",
            timeout=15
        )
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        result = {
            "success": True,
            "current_week": None,
            "current_semester": None,
            "semester_name": None
        }
        
        # 方法1: 从页面文本中查找
        # 通常格式为 "第X周" 或 "当前第X周"
        page_text = soup.get_text()
        
        # 提取当前周次
        week_patterns = [
            r'当前.*?第\s*(\d+)\s*周',
            r'第\s*(\d+)\s*周',
            r'教学周.*?(\d+)',
        ]
        for pattern in week_patterns:
            match = re.search(pattern, page_text)
            if match:
                result["current_week"] = int(match.group(1))
                break
        
        # 提取学期信息
        semester_patterns = [
            r'(\d{4}[-~–]\d{4})学年.*?第\s*(\d+)\s*学期',
            r'学期.*?(\d{4}[-~–]\d{4}).*?(\d+)',
        ]
        for pattern in semester_patterns:
            match = re.search(pattern, page_text)
            if match:
                year = match.group(1)
                term = match.group(2)
                result["semester_name"] = f"{year}学年第{term}学期"
                break
        
        # 方法2: 从JavaScript变量中提取
        scripts = soup.find_all("script")
        for script in scripts:
            if script.string:
                # 查找周次
                if not result["current_week"]:
                    week_match = re.search(r'currentWeek\s*[:=]\s*(\d+)', script.string)
                    if week_match:
                        result["current_week"] = int(week_match.group(1))
                
                # 查找学期
                if not result["current_semester"]:
                    sem_match = re.search(r'semester\.id\s*[:=]\s*["\']?(\d+)', script.string)
                    if sem_match:
                        result["current_semester"] = sem_match.group(1)
        
        # 方法3: 从cookie获取学期ID
        if not result["current_semester"]:
            for cookie in session.cookies:
                if cookie.name == "semester.id":
                    result["current_semester"] = cookie.value
                    break
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "current_week": None,
            "current_semester": None
        }


def get_student_detail(session: requests.Session) -> Dict:
    """
    从学生详情页获取详细信息（姓名、院系、专业等）
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        包含学生详细信息的字典
    """
    try:
        resp = session.get(
            "https://jwxt.xisu.edu.cn/eams/stdDetail.action",
            timeout=15
        )
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        result = {
            "success": True,
            "name": None,
            "student_code": None, # 学号
            "department": None,  # 院系
            "major": None,       # 专业
            "class_name": None,  # 班级
            "grade": None,       # 年级
            "student_type": None # 学生类型
        }
        
        # 从表格中提取信息
        tables = soup.find_all("table")
        
        # 需要排除的字段（这些不是我们要的信息）
        exclude_fields = ["学习形式", "培养方式", "入学方式"]
        
        # 调试：收集所有字段名
        all_fields = []
        
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all(["td", "th"])
                
                for i, cell in enumerate(cells):
                    cell_text = cell.get_text(strip=True)
                    
                    # 收集所有字段（用于调试）
                    if cell_text and i + 1 < len(cells):
                        all_fields.append(cell_text)
                    
                    # 跳过排除的字段
                    should_skip = False
                    for exclude in exclude_fields:
                        if exclude in cell_text:
                            should_skip = True
                            break
                    
                    if should_skip:
                        continue
                    
                    # 获取下一个单元格的值
                    if i + 1 < len(cells):
                        value = cells[i + 1].get_text(strip=True)
                        
                        # 移除冒号后再匹配（教务系统的标签都带冒号，如"学号："）
                        clean_cell_text = cell_text.rstrip('：:')
                        
                        if clean_cell_text == "姓名" and not result["name"]:
                            result["name"] = value
                        elif clean_cell_text == "学号" and not result["student_code"]:
                            result["student_code"] = value
                        elif clean_cell_text == "院系" and not result["department"]:
                            result["department"] = value
                        elif clean_cell_text == "专业" and not result["major"]:
                            result["major"] = value
                        elif clean_cell_text == "所属班级" and not result["class_name"]:
                            result["class_name"] = value
                        elif clean_cell_text == "年级" and not result["grade"]:
                            result["grade"] = value
                        elif clean_cell_text == "学生类别" and not result["student_type"]:
                            result["student_type"] = value
        
        # 备用方法：从标题或其他位置提取
        if not result["name"]:
            # 查找可能包含姓名的元素
            for tag in soup.find_all(['h1', 'h2', 'h3', 'div', 'span']):
                text = tag.get_text(strip=True)
                # 匹配中文姓名模式
                match = re.search(r'姓名[:：]\s*([\u4e00-\u9fa5]{2,4})', text)
                if match:
                    result["name"] = match.group(1)
                    break
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "name": None,
            "student_code": None,
            "department": None,
            "major": None
        }


def get_user_info(session: requests.Session) -> Dict:
    """
    获取当前登录用户的完整信息
    包括：学生ID、姓名、院系、专业、当前周次、当前学期等
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        包含用户完整信息的字典
    """
    try:
        user_info = {
            "success": True,
            "student_id": None,
            "student_code": None,
            "name": None,
            "username": None,
            "department": None,
            "major": None,
            "class_name": None,
            "grade": None,
            "current_week": None,
            "current_semester": None,
            "semester_name": None
        }
        
        # 关键方法: 从课程表页面的JavaScript中提取学生ID
        # 这是教务系统硬编码学生ID的地方
        course_resp = session.get(
            "https://jwxt.xisu.edu.cn/eams/courseTableForStd.action",
            timeout=15
        )
        course_resp.raise_for_status()
        
        # 从JavaScript函数中提取学生ID
        # 匹配: bg.form.addInput(form,"ids","122519");
        match = re.search(
            r'bg\.form\.addInput\s*\(\s*form\s*,\s*["\']ids["\']\s*,\s*["\'](\d+)["\']\s*\)',
            course_resp.text
        )
        if match:
            user_info["student_id"] = match.group(1)
        
        # 备用方法1: 从其他JavaScript模式提取
        if not user_info["student_id"]:
            # 匹配: "ids":"122519" 或 ids:"122519"
            match = re.search(r'["\']?ids["\']?\s*[:=]\s*["\'](\d+)["\']', course_resp.text)
            if match:
                user_info["student_id"] = match.group(1)
        
        # 备用方法2: 从课程表首页 index.action 兜底解析 ids
        if not user_info["student_id"]:
            try:
                idx_resp = session.get(
                    "https://jwxt.xisu.edu.cn/eams/courseTableForStd!index.action",
                    timeout=15
                )
                idx_resp.raise_for_status()
                html = idx_resp.text
                patterns = [
                    r'name\s*=\s*"ids"\s+value\s*=\s*"(\d+)",?',
                    r'<input[^>]*name\s*=\s*"ids"[^>]*value\s*=\s*"(\d+)"',
                    r'<option[^>]*value\s*=\s*"(\d+)"[^>]*selected',
                    r'addInput\([^)]*"ids"[^)]*"(\d+)"\)',
                    r'"ids"\s*:\s*"(\d+)"',
                    r'ids\s*=\s*"(\d+)"',
                    r'ids\s*=\s*(\d+)',
                ]
                for pattern in patterns:
                    m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
                    if m:
                        user_info["student_id"] = m.group(1)
                        break
            except Exception:
                pass

        # 备用方法3: 从个人信息页面获取
        if not user_info["student_id"]:
            resp = session.get("https://jwxt.xisu.edu.cn/eams/stdDetail.action", timeout=15)
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # 从表单或隐藏字段
            student_id_input = soup.find("input", {"name": re.compile(r"student.*id", re.I)})
            if student_id_input:
                user_info["student_id"] = student_id_input.get("value")
            
            # 从JavaScript变量
            if not user_info["student_id"]:
                scripts = soup.find_all("script")
                for script in scripts:
                    if script.string:
                        match = re.search(r'student[Ii]d\s*[=:]\s*["\']?(\d+)', script.string)
                        if match:
                            user_info["student_id"] = match.group(1)
                            break
        
        # 获取学生详细信息（姓名、学号、院系、专业等）
        detail_info = get_student_detail(session)
        if detail_info.get("success"):
            if detail_info.get("name"):
                user_info["name"] = detail_info["name"]
            if detail_info.get("student_code"):
                user_info["student_code"] = detail_info["student_code"]
            if detail_info.get("department"):
                user_info["department"] = detail_info["department"]
            if detail_info.get("major"):
                user_info["major"] = detail_info["major"]
            if detail_info.get("class_name"):
                user_info["class_name"] = detail_info["class_name"]
            if detail_info.get("grade"):
                user_info["grade"] = detail_info["grade"]
        
        # 备用方法：从课程表页面提取姓名
        if not user_info["name"]:
            course_soup = BeautifulSoup(course_resp.text, "html.parser")
            welcome_text = course_soup.find(string=re.compile(r'欢迎|您好'))
            if welcome_text:
                match = re.search(r'[欢迎您好,，\s]+([\u4e00-\u9fa5]{2,4})', welcome_text)
                if match:
                    user_info["name"] = match.group(1)
        
        # 获取当前教学周和学期信息
        week_semester_info = get_current_week_and_semester(session)
        if week_semester_info.get("success"):
            if week_semester_info.get("current_week"):
                user_info["current_week"] = week_semester_info["current_week"]
            if week_semester_info.get("current_semester"):
                user_info["current_semester"] = week_semester_info["current_semester"]
            if week_semester_info.get("semester_name"):
                user_info["semester_name"] = week_semester_info["semester_name"]
        
        return user_info
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "student_id": None,
            "name": None
        }


def get_student_id(session: requests.Session) -> Optional[str]:
    """
    快速获取学生ID（简化版）
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        学生ID字符串，失败返回None
    """
    info = get_user_info(session)
    return info.get("student_id")
