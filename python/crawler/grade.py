#!/usr/bin/env python3
"""成绩模块 - 处理成绩数据获取和解析"""

import time
from typing import Dict, List
import requests
from bs4 import BeautifulSoup

from semester import get_semester_id


class GradeError(Exception):
    """成绩相关异常"""
    pass


def parse_grade_table(html_content: str) -> List[Dict]:
    """
    从HTML中解析成绩表格
    
    Args:
        html_content: HTML内容
        
    Returns:
        成绩列表
    """
    soup = BeautifulSoup(html_content, "html.parser")
    grades = []
    
    # 查找成绩表格
    tables = soup.find_all("table")
    
    for table in tables:
        headers = table.find_all("th")
        if headers and any("课程" in th.get_text(strip=True) for th in headers):
            # 解析表头
            header_texts = [th.get_text(strip=True) for th in headers if th.get_text(strip=True)]
            
            # 解析数据行
            tbody = table.find("tbody")
            if tbody:
                rows = tbody.find_all("tr")
                for row in rows:
                    cells = row.find_all(["td", "th"])
                    cell_texts = [cell.get_text(strip=True) for cell in cells]
                    
                    # 如果行有实际数据
                    if any(text for text in cell_texts):
                        grade_info = {"id": len(grades) + 1}
                        for j, cell_text in enumerate(cell_texts):
                            if j < len(header_texts):
                                # 保留所有字段，即使是空值
                                grade_info[header_texts[j]] = cell_text
                        
                        if len(grade_info) > 1:
                            grades.append(grade_info)
            break
    
    return grades


def calculate_grade_statistics(grades: List[Dict]) -> Dict:
    """
    计算成绩统计信息
    
    Args:
        grades: 成绩列表
        
    Returns:
        统计信息字典
    """
    statistics = {
        "total_courses": len(grades),
        "average_score": None,
        "weighted_average": None,
        "numeric_grades_count": 0,
        "total_credits": 0,
        "grade_distribution": {}
    }
    
    if not grades:
        return statistics
    
    numeric_scores = []
    total_credits = 0
    weighted_score_sum = 0
    
    for grade in grades:
        # 提取学分
        credits = 0
        if "学分" in grade and grade["学分"]:
            try:
                credits = float(grade["学分"])
                total_credits += credits
            except (ValueError, TypeError):
                pass
        
        # 提取最终成绩
        final_score = None
        score_fields = ["最终", "总评成绩", "成绩", "总评"]
        
        for field in score_fields:
            if field in grade and grade[field]:
                score_text = str(grade[field])
                try:
                    if score_text.replace(".", "").replace("-", "").isdigit():
                        final_score = float(score_text)
                        break
                except (ValueError, TypeError):
                    continue
        
        if final_score is not None:
            numeric_scores.append(final_score)
            if credits > 0:
                weighted_score_sum += final_score * credits
    
    # 计算平均分
    if numeric_scores:
        simple_average = sum(numeric_scores) / len(numeric_scores)
        statistics["average_score"] = round(simple_average, 2)
        statistics["numeric_grades_count"] = len(numeric_scores)
        
        # 如果有学分信息，计算加权平均分
        if total_credits > 0:
            weighted_average = weighted_score_sum / total_credits
            statistics["weighted_average"] = round(weighted_average, 2)
            statistics["total_credits"] = total_credits
        
        # 成绩分布统计
        grade_ranges = {
            "90-100": 0,
            "80-89": 0,
            "70-79": 0,
            "60-69": 0,
            "60以下": 0
        }
        
        for score in numeric_scores:
            if score >= 90:
                grade_ranges["90-100"] += 1
            elif score >= 80:
                grade_ranges["80-89"] += 1
            elif score >= 70:
                grade_ranges["70-79"] += 1
            elif score >= 60:
                grade_ranges["60-69"] += 1
            else:
                grade_ranges["60以下"] += 1
        
        statistics["grade_distribution"] = grade_ranges
    
    return statistics


def get_grade_report(session: requests.Session, semester_id: str = None) -> Dict:
    """
    获取学生成绩报告
    
    Args:
        session: 已登录的requests.Session对象
        semester_id: 学期ID，如果为None则自动获取并尝试多个学期
        
    Returns:
        包含成绩数据的字典
    """
    try:
        # 如果指定了学期ID，直接查询
        if semester_id:
            return _fetch_grade_for_semester(session, semester_id)
        
        # 否则尝试多个学期
        # 优先尝试当前学期
        current_semester = get_semester_id(session)
        
        # 构建尝试列表（常见学期ID）
        try_semesters = []
        if current_semester:
            try_semesters.append(current_semester)
        
        # 添加常见学期ID（2024-2025和2023-2024学年）
        common_semesters = ["169", "170", "168", "167", "166", "165"]
        for sem_id in common_semesters:
            if sem_id not in try_semesters:
                try_semesters.append(sem_id)
        
        # 尝试每个学期直到找到成绩
        for sem_id in try_semesters[:5]:  # 最多尝试5个学期
            result = _fetch_grade_for_semester(session, sem_id)
            if result.get("success") and result.get("grades"):
                return result
        
        # 所有尝试都失败，返回空结果
        return {
            "success": True,
            "semester_id": try_semesters[0] if try_semesters else "169",
            "grades": [],
            "statistics": {},
            "total_courses": 0,
            "message": f"尝试了学期 {try_semesters[:5]}，未找到成绩数据"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "grades": [],
            "statistics": {},
            "total_courses": 0
        }


def _fetch_grade_for_semester(session: requests.Session, semester_id: str) -> Dict:
    """
    获取指定学期的成绩（内部函数）
    
    Args:
        session: 已登录的requests.Session对象
        semester_id: 学期ID
        
    Returns:
        包含成绩数据的字典
    """
    try:
        
        # 构造成绩查询URL
        timestamp = int(time.time() * 1000)
        grade_url = "https://jwxt.xisu.edu.cn/eams/teach/grade/course/person!search.action"
        
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://jwxt.xisu.edu.cn",
            "Referer": "https://jwxt.xisu.edu.cn/eams/home.action",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            )
        }
        
        post_data = {
            "semesterId": semester_id,
            "projectType": "",
            "_": str(timestamp)
        }
        
        resp = session.post(grade_url, headers=headers, data=post_data, timeout=15)
        resp.raise_for_status()
        
        # 检查是否返回登录页面
        if "教务管理系统" in resp.text and "用户名" in resp.text:
            return {
                "success": False,
                "error": "需要重新登录",
                "grades": [],
                "statistics": {}
            }
        
        # 解析成绩表格
        grades = parse_grade_table(resp.text)
        
        # 计算统计信息
        statistics = calculate_grade_statistics(grades)
        
        return {
            "success": True,
            "semester_id": semester_id,
            "grades": grades,
            "statistics": statistics,
            "total_courses": len(grades)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "grades": [],
            "statistics": {},
            "total_courses": 0
        }


def get_all_grades(session: requests.Session, semester_ids: List[str] = None) -> Dict:
    """
    获取多个学期的成绩
    
    Args:
        session: 已登录的requests.Session对象
        semester_ids: 学期ID列表，如果为None则尝试常见学期
        
    Returns:
        包含多学期成绩的字典
    """
    if not semester_ids:
        semester_ids = ["169", "168", "167", "166", "165"]
    
    all_results = []
    total_grades = []
    
    for sem_id in semester_ids:
        result = get_grade_report(session, sem_id)
        if result.get("success") and result.get("grades"):
            all_results.append({
                "semester_id": sem_id,
                "grades": result["grades"],
                "statistics": result["statistics"]
            })
            total_grades.extend(result["grades"])
    
    # 计算总体统计
    overall_statistics = calculate_grade_statistics(total_grades)
    
    return {
        "success": True,
        "semesters": all_results,
        "total_semesters": len(all_results),
        "total_grades": len(total_grades),
        "overall_statistics": overall_statistics
    }


def get_grade_summary(session: requests.Session, semester_id: str = None) -> Dict:
    """
    获取成绩摘要（只包含关键信息）
    
    Args:
        session: 已登录的requests.Session对象
        semester_id: 学期ID
        
    Returns:
        包含成绩摘要的字典
    """
    full_result = get_grade_report(session, semester_id)
    
    if not full_result.get("success"):
        return full_result
    
    # 简化成绩信息
    simple_grades = []
    for grade in full_result.get("grades", []):
        simple_grade = {}
        
        # 提取所有字段（包括补考成绩等）
        key_fields = [
            "学年学期", "课程代码", "课程序号", "课程名称", "课程类别",
            "学分", "补考成绩", "总评成绩", "最终", "绩点",
            "成绩", "总评"  # 兼容旧字段名
        ]
        for field in key_fields:
            if field in grade:
                simple_grade[field] = grade[field]
        
        # 如果没有标准字段名，尝试包含关键词的字段
        if not simple_grade:
            for key, value in grade.items():
                if any(keyword in key for keyword in ["课程", "学分", "成绩", "绩点"]):
                    simple_grade[key] = value
        
        if simple_grade:
            simple_grades.append(simple_grade)
    
    return {
        "success": True,
        "semester_id": full_result.get("semester_id"),
        "grades": simple_grades,
        "statistics": full_result.get("statistics", {}),
        "total_courses": len(simple_grades)
    }
