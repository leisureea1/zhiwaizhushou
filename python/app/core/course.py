"""
课程表服务
"""

import re
from typing import Dict, List, Optional
import requests

from .constants import JWXT_BASE_URL, TIME_SLOTS, WEEKDAYS, DEFAULT_HEADERS


class CourseService:
    """课程表服务"""
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_table(self, semester_id: str, student_id: str) -> Dict:
        """获取课程表"""
        try:
            # 初始化
            self.session.get(f"{JWXT_BASE_URL}/eams/courseTableForStd.action", timeout=15)
            
            headers = {
                **DEFAULT_HEADERS,
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": JWXT_BASE_URL,
                "Referer": f"{JWXT_BASE_URL}/eams/courseTableForStd!index.action",
            }
            
            data = {
                "ignoreHead": "1",
                "setting.kind": "std",
                "startWeek": "",
                "semester.id": semester_id,
                "ids": student_id,
            }
            
            resp = self.session.post(
                f"{JWXT_BASE_URL}/eams/courseTableForStd!courseTable.action",
                headers=headers, data=data, timeout=15
            )
            
            courses = self._parse_courses(resp.text)
            
            return {
                "success": True,
                "courses": courses,
                "total_courses": len(courses),
                "semester_id": semester_id,
            }
        except Exception as e:
            return {"success": False, "error": str(e), "courses": []}
    
    def _parse_courses(self, html: str) -> List[Dict]:
        """解析课程数据"""
        courses = []
        
        # 匹配 TaskActivity
        pattern = r'(var\s+teachers\s*=.*?)activity\s*=\s*new\s+TaskActivity\s*\((.*?)\);(.*?)(?=var\s+teachers\s*=|$)'
        blocks = re.findall(pattern, html, re.DOTALL)
        
        for i, (code_block, params_str, following) in enumerate(blocks):
            try:
                params = self._parse_params(params_str)
                if len(params) < 7:
                    continue
                
                course = {
                    "id": i + 1,
                    "course_id": self._clean(params[2]).split('(')[0],
                    "course_name": self._clean(params[3]).split('(')[0],
                    "teacher_name": self._extract_teacher(code_block) or self._clean(params[1]),
                    "classroom": self._clean(params[5]),
                    "time_pattern": self._clean(params[6]),
                }
                
                # 解析时间
                time_slots = self._parse_time_slots(following)
                if time_slots:
                    course["time_slots"] = time_slots
                    course["schedule"] = self._format_schedule(time_slots)
                
                # 解析周次
                weeks = self._parse_weeks(course["time_pattern"])
                if weeks:
                    course["weeks"] = weeks
                    course["weeks_display"] = self._format_weeks(weeks)
                
                courses.append(course)
            except Exception:
                continue
        
        return courses
    
    def _parse_params(self, s: str) -> List[str]:
        """解析参数"""
        params, current, in_quotes, quote = [], "", False, None
        for c in s:
            if c in '"\'':
                if not in_quotes:
                    in_quotes, quote = True, c
                elif c == quote:
                    in_quotes, quote = False, None
                current += c
            elif c == ',' and not in_quotes:
                params.append(current.strip())
                current = ""
            else:
                current += c
        if current.strip():
            params.append(current.strip())
        return params
    
    def _clean(self, s: str) -> str:
        """清理字符串"""
        s = s.strip()
        if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
            return s[1:-1]
        return s
    
    def _extract_teacher(self, code: str) -> Optional[str]:
        """提取教师名"""
        match = re.search(r'var\s+actTeachers\s*=\s*\[(.*?)\];', code, re.DOTALL)
        if match:
            names = re.findall(r'name\s*:\s*["\']([^"\']+)["\']', match.group(1))
            if names:
                return ', '.join(names)
        return None

    def _parse_time_slots(self, code: str) -> List[Dict]:
        """解析时间槽"""
        slots = []
        patterns = [
            r'index\s*=\s*(\d+)\s*\*\s*unitCount\s*\+\s*(\d+);',
            r'index\s*=\s*(\d+);'
        ]
        
        for pattern in patterns:
            for match in re.findall(pattern, code):
                if len(match) == 2:
                    idx = int(match[0]) * 12 + int(match[1])
                else:
                    idx = int(match)
                
                weekday_idx = idx // 12
                period_idx = idx % 12
                
                if 0 <= weekday_idx < 7 and period_idx in TIME_SLOTS:
                    start, end = TIME_SLOTS[period_idx]
                    slots.append({
                        "weekday": WEEKDAYS[weekday_idx],
                        "weekday_index": weekday_idx + 1,
                        "period": period_idx + 1,
                        "start_time": start,
                        "end_time": end,
                    })
        
        return slots
    
    def _format_schedule(self, slots: List[Dict]) -> List[Dict]:
        """格式化课程安排"""
        groups = {}
        for slot in slots:
            day = slot["weekday"]
            if day not in groups:
                groups[day] = []
            groups[day].append(slot)
        
        schedule = []
        for day, day_slots in groups.items():
            periods = sorted(set(s["period"] for s in day_slots))
            first = min(day_slots, key=lambda x: x["period"])
            last = max(day_slots, key=lambda x: x["period"])
            
            schedule.append({
                "weekday": day,
                "periods": self._format_periods(periods),
                "time_range": f"{first['start_time']}-{last['end_time']}",
            })
        
        return schedule
    
    def _format_periods(self, periods: List[int]) -> str:
        """格式化节次"""
        if not periods:
            return ""
        
        ranges = []
        start = end = periods[0]
        
        for p in periods[1:]:
            if p == end + 1:
                end = p
            else:
                ranges.append(f"{start}-{end}节" if start != end else f"{start}节")
                start = end = p
        ranges.append(f"{start}-{end}节" if start != end else f"{start}节")
        
        return ", ".join(ranges)
    
    def _parse_weeks(self, pattern: str) -> List[int]:
        """解析周次"""
        weeks = []
        if pattern and len(pattern) > 10:
            for i, c in enumerate(pattern):
                if c == '1' and i > 0:
                    weeks.append(i)
        return weeks
    
    def _format_weeks(self, weeks: List[int]) -> str:
        """格式化周次显示"""
        if not weeks:
            return ""
        
        ranges = []
        start = end = weeks[0]
        
        for w in weeks[1:]:
            if w == end + 1:
                end = w
            else:
                ranges.append(f"{start}-{end}周" if start != end else f"{start}周")
                start = end = w
        ranges.append(f"{start}-{end}周" if start != end else f"{start}周")
        
        return ", ".join(ranges)
