#!/usr/bin/env python3
"""课程表模块 - 处理课程表数据获取和解析"""

import re
from typing import Dict, List, Optional
import requests

from semester import get_semester_id
from user_info import get_student_id


class CourseError(Exception):
    """课程表相关异常"""
    pass


def calculate_time_info(index: int, unit_count: int = 12) -> Optional[Dict]:
    """根据索引计算星期和节次"""
    weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
    time_slots = {
        0: "第1节 (08:00-08:50)", 1: "第2节 (09:00-09:50)",
        2: "第3节 (10:10-11:00)", 3: "第4节 (11:10-12:00)",
        4: "第5节 (12:00-14:00)", 5: "第6节 (14:00-14:50)",
        6: "第7节 (15:00-15:50)", 7: "第8节 (16:10-17:00)",
        8: "第9节 (17:10-18:00)", 9: "第10节 (18:00-19:10)",
        10: "第11节 (19:10-20:00)", 11: "第12节 (20:10-21:00)"
    }
    
    weekday_index = index // unit_count
    period_index = index % unit_count
    
    if 0 <= weekday_index < len(weekdays) and 0 <= period_index < len(time_slots):
        return {
            "weekday": weekdays[weekday_index],
            "period": period_index + 1,
            "period_name": time_slots[period_index],
            "time_slot": time_slots[period_index].split(" (")[1].rstrip(")")
        }
    return None


def extract_teacher_names_from_block(code_block: str) -> Optional[str]:
    """
    从代码块中提取教师名称
    
    Args:
        code_block: TaskActivity之前的JavaScript代码块
        
    Returns:
        教师名称字符串，如果无法提取则返回None
    """
    # 查找 actTeachers 数组定义
    # 格式: var actTeachers = [{id:5421,name:"梁东亮",lab:false}];
    pattern = r'var\s+actTeachers\s*=\s*\[(.*?)\];'
    match = re.search(pattern, code_block, re.DOTALL)
    
    if match:
        teachers_str = match.group(1)
        # 提取所有 name 字段
        # 匹配 name:"教师名" 或 name:'教师名'
        names = re.findall(r'name\s*:\s*["\']([^"\']+)["\']', teachers_str)
        if names:
            return ', '.join(names)
    
    # 备用方法：直接从 teachers 数组提取
    pattern = r'var\s+teachers\s*=\s*\[(.*?)\];'
    match = re.search(pattern, code_block, re.DOTALL)
    
    if match:
        teachers_str = match.group(1)
        names = re.findall(r'name\s*:\s*["\']([^"\']+)["\']', teachers_str)
        if names:
            return ', '.join(names)
    
    return None


def parse_course_params(params_str: str) -> List[str]:
    """解析TaskActivity参数字符串"""
    params = []
    current_param = ""
    in_quotes = False
    quote_char = None
    
    for char in params_str:
        if char in ['"', "'"] and not in_quotes:
            in_quotes = True
            quote_char = char
            current_param += char
        elif char == quote_char and in_quotes:
            in_quotes = False
            quote_char = None
            current_param += char
        elif char == ',' and not in_quotes:
            params.append(current_param.strip())
            current_param = ""
        else:
            current_param += char
    
    if current_param.strip():
        params.append(current_param.strip())
    
    return params


def clean_param(param: str) -> str:
    """清理参数字符串"""
    param = param.strip()
    if param.startswith('"') and param.endswith('"'):
        return param[1:-1]
    if param.startswith("'") and param.endswith("'"):
        return param[1:-1]
    return param


def normalize_student_id(raw_student_id: Optional[str]) -> Optional[str]:
    """将获取到的 student_id 清洗为纯数字形式。

    优先选择最长的数字序列，适配形如 'ids=122519', '["122519"]', ' 122519 ' 等返回。
    """
    if not raw_student_id:
        return None
    text = str(raw_student_id).strip()
    matches = re.findall(r"\d+", text)
    if not matches:
        return None
    # 选择最长的数字片段，避免误抓取较短的无关数字
    candidate = max(matches, key=len)
    return candidate or None


def fetch_student_id_from_index(session: requests.Session) -> Optional[str]:
    """从课程表首页 index.action 兜底解析 ids。"""
    try:
        resp = session.get(
            "https://jwxt.xisu.edu.cn/eams/courseTableForStd!index.action",
            timeout=15
        )
        resp.raise_for_status()
    except Exception:
        return None

    html = resp.text

    patterns = [
        r'name\s*=\s*"ids"\s+value\s*=\s*"(\d+)"',
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
            return normalize_student_id(m.group(1))

    return None


def parse_weeks_from_pattern(time_pattern: str) -> List[int]:
    """从时间模式字符串解析上课周次
    
    时间模式是一个53位的二进制字符串，每位代表一周：
    - 索引0对应第0周（占位，不使用）
    - 索引1对应第1周
    - 索引2对应第2周
    - ...
    - '1' 表示该周有课
    - '0' 表示该周无课
    
    例如: "00011111111011111100..." 表示第3-10周、第12-17周有课
    """
    weeks = []
    if time_pattern and len(time_pattern) > 10:
        for week_idx, char in enumerate(time_pattern):
            if char == '1' and week_idx > 0:  # 跳过索引0
                weeks.append(week_idx)  # 直接使用索引作为周次
    return weeks


def format_weeks_display(weeks: List[int]) -> str:
    """格式化周次显示为区间形式"""
    if not weeks:
        return ""
    
    ranges = []
    start = prev = weeks[0]
    
    for current in weeks[1:]:
        if current == prev + 1:
            prev = current
            continue
        ranges.append((start, prev))
        start = prev = current
    ranges.append((start, prev))
    
    parts = []
    for begin, end in ranges:
        if begin == end:
            parts.append(f"{begin}周")
        else:
            parts.append(f"{begin}-{end}周")
    
    return ", ".join(parts)


def get_course_table(session: requests.Session, semester_id: str = None, student_id: str = None) -> Dict:
    """
    获取学生课程表
    
    Args:
        session: 已登录的requests.Session对象
        semester_id: 学期ID，如果为None则自动获取
        student_id: 学生ID，如果为None则获取当前登录用户的课表
        
    Returns:
        包含课程表数据的字典
    """
    try:
        # 获取学期ID
        if not semester_id:
            semester_id = get_semester_id(session)
            if not semester_id:
                semester_id = "209"
        
        # 初始化课程表会话
        init_resp = session.get("https://jwxt.xisu.edu.cn/eams/courseTableForStd.action", timeout=15)
        init_resp.raise_for_status()
        
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://jwxt.xisu.edu.cn",
            "Referer": "https://jwxt.xisu.edu.cn/eams/courseTableForStd!index.action",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            )
        }
        
        # 构造POST数据
        post_data = {
            "ignoreHead": "1",
            "setting.kind": "std",
            "startWeek": "",
            "semester.id": semester_id,
         
            
        }
        
        # 获取学生ID（如果未提供则自动获取），并清洗/兜底
        candidate_id = student_id if student_id else get_student_id(session)
        normalized_id = normalize_student_id(candidate_id)

        if not normalized_id:
            normalized_id = fetch_student_id_from_index(session)

        if normalized_id:
            post_data["ids"] = normalized_id
        else:
            return {
                "success": False,
                "error": "无法确定学生ID(ids)。请确认已登录或手动传入有效的 student_id。",
                "courses": [],
                "total_courses": 0,
                "semester_id": semester_id
            }
        
        resp = session.post(
            "https://jwxt.xisu.edu.cn/eams/courseTableForStd!courseTable.action",
            headers=headers,
            data=post_data,
            timeout=15
        )
        resp.raise_for_status()
        
        # 解析课程数据
        courses = []
        
        # 提取TaskActivity及其前面的代码块
        # 匹配模式：var teachers = ... 到 activity = new TaskActivity(...);
        activity_pattern = r'(var\s+teachers\s*=.*?)activity\s*=\s*new\s+TaskActivity\s*\((.*?)\);(.*?)(?=var\s+teachers\s*=|$)'
        activity_blocks = re.findall(activity_pattern, resp.text, re.DOTALL)
        
        for i, (code_block, activity_params, following_code) in enumerate(activity_blocks):
            try:
                params = parse_course_params(activity_params)
                
                if len(params) >= 7:
                    teacher_id = clean_param(params[0])
                    
                    # 从代码块中提取教师名
                    teacher_name = extract_teacher_names_from_block(code_block)
                    if not teacher_name:
                        # 如果提取失败，使用参数中的值
                        teacher_name = clean_param(params[1])
                        # 如果是join调用，尝试从整个脚本中查找
                        if 'join' in teacher_name:
                            teacher_name = None
                    course_id_full = clean_param(params[2])
                    course_name_full = clean_param(params[3])
                    class_id = clean_param(params[4])
                    room = clean_param(params[5])
                    time_pattern = clean_param(params[6])
                    
                    # 解析课程ID和名称
                    course_id = course_id_full.split('(')[0] if '(' in course_id_full else course_id_full
                    course_name = course_name_full.split('(')[0] if '(' in course_name_full else course_name_full
                    
                    # 提取时间索引
                    time_slots = []
                    index_patterns = [
                        r'index\s*=\s*(\d+)\s*\*\s*unitCount\s*\+\s*(\d+);',
                        r'index\s*=\s*(\d+);'
                    ]
                    
                    for pattern in index_patterns:
                        matches = re.findall(pattern, following_code)
                        for match in matches:
                            if len(match) == 2:
                                weekday_idx, period_idx = int(match[0]), int(match[1])
                                index = weekday_idx * 12 + period_idx
                            else:
                                index = int(match)
                            
                            time_info = calculate_time_info(index)
                            if time_info:
                                time_slots.append(time_info)
                    
                    course_info = {
                        "id": i + 1,
                        "course_id": course_id,
                        "course_name": course_name,
                        "teacher_id": teacher_id,
                        "teacher_name": teacher_name,
                        "class_id": class_id,
                        "classroom": room,
                        "time_pattern": time_pattern,
                        "time_slots": time_slots
                    }
                    
                    # 解析上课周次
                    weeks = parse_weeks_from_pattern(time_pattern)
                    if weeks:
                        course_info["weeks"] = weeks
                        course_info["total_weeks"] = len(weeks)
                        course_info["weeks_display"] = format_weeks_display(weeks)
                    
                    # 生成时间安排摘要
                    if time_slots:
                        weekday_groups = {}
                        for slot in time_slots:
                            weekday = slot["weekday"]
                            if weekday not in weekday_groups:
                                weekday_groups[weekday] = []
                            weekday_groups[weekday].append(slot)
                        
                        schedule_summary = []
                        for weekday, slots in weekday_groups.items():
                            periods = sorted(set(slot["period"] for slot in slots))
                            
                            # 合并连续节次
                            ranges = []
                            start = end = periods[0]
                            for period in periods[1:]:
                                if period == end + 1:
                                    end = period
                                else:
                                    ranges.append(f"第{start}-{end}节" if start != end else f"第{start}节")
                                    start = end = period
                            ranges.append(f"第{start}-{end}节" if start != end else f"第{start}节")
                            
                            first_slot = min(slots, key=lambda x: x["period"])
                            last_slot = max(slots, key=lambda x: x["period"])
                            start_time = first_slot["time_slot"].split("-")[0]
                            end_time = last_slot["time_slot"].split("-")[1]
                            
                            schedule_summary.append({
                                "weekday": weekday,
                                "periods": ", ".join(ranges),
                                "time_range": f"{start_time}-{end_time}"
                            })
                        
                        course_info["schedule_summary"] = schedule_summary
                    
                    courses.append(course_info)
                    
            except Exception as e:
                continue
        
        return {
            "success": True,
            "courses": courses,
            "total_courses": len(courses),
            "semester_id": semester_id
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "courses": [],
            "total_courses": 0
        }
