#!/usr/bin/env python3
"""学期信息模块 - 处理学期ID和日历数据"""

import re
import json
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup


class SemesterError(Exception):
    """学期信息相关异常"""
    pass


def get_available_semesters(session: requests.Session) -> Dict:
    """
    获取所有可用的学期列表
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        包含可用学期列表的字典
    """
    try:
        # 访问课程表页面
        resp = session.get("https://jwxt.xisu.edu.cn/eams/courseTableForStd.action", timeout=15)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # 从cookie获取当前学期
        current_semester = None
        for cookie in session.cookies:
            if cookie.name == "semester.id":
                current_semester = cookie.value
                break
        
        # 尝试从页面中提取学期选择下拉框
        semesters = []
        semester_select = soup.find("select", {"id": "semester_id"}) or soup.find("select", {"name": "semester.id"})
        
        if semester_select:
            # 从下拉框选项中提取学期列表
            for option in semester_select.find_all("option"):
                sem_id = option.get("value", "").strip()
                sem_name = option.get_text(strip=True)
                if sem_id and sem_id.isdigit():
                    semester_data = {"id": sem_id, "name": sem_name}
                    if sem_id == current_semester:
                        semester_data["current"] = True
                    semesters.append(semester_data)
        
        # 如果从下拉框没找到，尝试从JavaScript中提取
        if not semesters:
            for script in soup.find_all("script"):
                if script.string and "semesterCalendar" in script.string:
                    # 尝试提取 semesters 数组
                    semester_pattern = r'semesters\s*[:=]\s*(\{[^}]+\})'
                    match = re.search(semester_pattern, script.string, re.DOTALL)
                    if match:
                        try:
                            # 尝试解析学期数据结构
                            semester_json = match.group(1)
                            # 这里可能需要更复杂的解析逻辑
                            pass
                        except:
                            pass
        
        # 如果还是没找到，使用备用方案：查询学期日历数据
        if not semesters and current_semester:
            calendar_data = query_semester_calendar(session, current_semester)
            if calendar_data.get("success") and "data" in calendar_data:
                parsed = parse_semester_data(calendar_data)
                if parsed.get("all_semesters"):
                    for sem in parsed["all_semesters"]:
                        semester_data = {
                            "id": str(sem["id"]),
                            "name": sem["display_name"]
                        }
                        if str(sem["id"]) == str(current_semester):
                            semester_data["current"] = True
                        semesters.append(semester_data)
        
        # 如果所有方法都失败，返回硬编码的常用学期列表
        if not semesters:
            semesters = [
                {"id": "209", "name": "2025-2026学年第1学期"},
                {"id": "208", "name": "2024-2025学年第2学期"},
                {"id": "207", "name": "2024-2025学年第1学期"},
                {"id": "206", "name": "2023-2024学年第2学期"},
                {"id": "205", "name": "2023-2024学年第1学期"},
            ]
            # 标记当前学期
            if current_semester:
                for sem in semesters:
                    if sem["id"] == current_semester:
                        sem["current"] = True
                        break
        
        return {
            "success": True,
            "semesters": semesters,
            "current_semester": current_semester,
            "message": f"找到 {len(semesters)} 个学期"
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "detail": traceback.format_exc(),
            "semesters": [],
            "message": "获取学期列表失败"
        }


def get_semester_id(session: requests.Session) -> Optional[str]:
    """
    从教务系统获取当前学期ID
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        学期ID字符串，如果获取失败则返回None
    """
    # 方法1：从cookies中获取
    for cookie in session.cookies:
        if cookie.name == "semester.id":
            return cookie.value
    
    # 方法2：从多个页面尝试提取
    urls_to_try = [
        "https://jwxt.xisu.edu.cn/eams/stdDetail.action",
        "https://jwxt.xisu.edu.cn/eams/courseTableForStd.action",
        "https://jwxt.xisu.edu.cn/eams/courseTableForStd!index.action",
        "https://jwxt.xisu.edu.cn/eams/home.action"
    ]
    
    for url in urls_to_try:
        try:
            resp = session.get(url, timeout=15)
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # 从JavaScript中查找学期ID
            scripts = soup.find_all("script")
            for script in scripts:
                if script.string and "semester" in script.string.lower():
                    patterns = [
                        r'semester\.id["\']?\s*[:=]\s*["\']?(\d+)',
                        r'semesterId["\']?\s*[:=]\s*["\']?(\d+)',
                        r'"semester"\s*:\s*["\']?(\d+)',
                        r'semester\s*=\s*["\']?(\d+)'
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, script.string, re.IGNORECASE)
                        if match:
                            return match.group(1)
            
            # 从隐藏input字段查找
            semester_inputs = soup.find_all("input", {"name": re.compile(r"semester", re.IGNORECASE)})
            for input_el in semester_inputs:
                if input_el.get("value") and input_el.get("value").isdigit():
                    return input_el.get("value")
            
            # 从选择框查找
            selects = soup.find_all("select", {"name": re.compile(r"semester", re.IGNORECASE)})
            for select in selects:
                options = select.find_all("option", {"selected": True})
                if not options:
                    options = select.find_all("option")
                for option in options:
                    value = option.get("value")
                    if value and value.isdigit():
                        return value
                        
        except Exception:
            continue
    
    return None


def query_semester_calendar(session: requests.Session, semester_id: str = "169") -> Dict:
    """
    查询学期日历数据
    
    Args:
        session: 已登录的requests.Session对象
        semester_id: 学期ID
        
    Returns:
        包含学期日历数据的字典
    """
    try:
        # 先访问课程表页面初始化
        init_resp = session.get("https://jwxt.xisu.edu.cn/eams/courseTableForStd.action", timeout=15)
        init_resp.raise_for_status()
        
        headers = {
            "Accept": "text/plain, */*; q=0.01",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://jwxt.xisu.edu.cn",
            "Referer": "https://jwxt.xisu.edu.cn/eams/courseTableForStd.action",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            )
        }
        
        data = {
            "tagId": "semesterBar18813058821Semester",
            "dataType": "semesterCalendar",
            "value": semester_id,
            "empty": "false"
        }
        
        resp = session.post(
            "https://jwxt.xisu.edu.cn/eams/dataQuery.action",
            headers=headers,
            data=data,
            timeout=15
        )
        resp.raise_for_status()
        
        response_text = resp.text.strip()
        
        # 尝试解析JavaScript对象格式
        if response_text.startswith("{") and response_text.endswith("}"):
            json_text = re.sub(r'(\w+):', r'"\1":', response_text)
            try:
                parsed_data = json.loads(json_text)
                return {
                    "success": True,
                    "data": parsed_data,
                    "semester_id": semester_id
                }
            except json.JSONDecodeError:
                pass
        
        return {
            "success": True,
            "raw_content": response_text,
            "semester_id": semester_id
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "semester_id": semester_id
        }


def parse_semester_data(semester_response: Dict) -> Dict:
    """
    解析学期日历数据
    
    Args:
        semester_response: query_semester_calendar返回的响应数据
        
    Returns:
        解析后的学期信息字典
    """
    if not semester_response.get("success"):
        return {"error": semester_response.get("error", "未知错误")}
    
    data = semester_response.get("data")
    if not data or "semesters" not in data:
        return {"error": "响应中没有学期数据"}
    
    semesters = data["semesters"]
    current_semester_id = data.get("semesterId")
    
    all_semesters = []
    for year_key, year_semesters in semesters.items():
        for semester in year_semesters:
            all_semesters.append({
                "id": semester["id"],
                "school_year": semester["schoolYear"],
                "term": semester["name"],
                "display_name": f"{semester['schoolYear']} 学期{semester['name']}"
            })
    
    current_semester = None
    for semester in all_semesters:
        if str(semester["id"]) == str(current_semester_id):
            current_semester = semester
            break
    
    return {
        "current_semester": current_semester,
        "all_semesters": all_semesters,
        "total_count": len(all_semesters)
    }


def get_semester_info(session: requests.Session) -> Dict:
    """
    获取完整的学期信息（组合函数）
    
    Args:
        session: 已登录的requests.Session对象
        
    Returns:
        包含当前学期ID和所有学期列表的字典
    """
    try:
        # 获取当前学期ID
        current_id = get_semester_id(session)
        if not current_id:
            current_id = "169"  # 默认值
        
        # 查询学期日历
        calendar_data = query_semester_calendar(session, current_id)
        
        if not calendar_data.get("success"):
            return {
                "success": False,
                "error": calendar_data.get("error"),
                "current_semester_id": current_id
            }
        
        # 解析学期数据
        if "data" in calendar_data:
            parsed = parse_semester_data(calendar_data)
            return {
                "success": True,
                "current_semester_id": current_id,
                "current_semester": parsed.get("current_semester"),
                "all_semesters": parsed.get("all_semesters", []),
                "total_count": parsed.get("total_count", 0)
            }
        else:
            return {
                "success": True,
                "current_semester_id": current_id,
                "message": "获取到学期ID，但无法解析详细信息"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
