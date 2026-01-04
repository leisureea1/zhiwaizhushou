"""
用户信息服务
"""

import re
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup

from .constants import JWXT_BASE_URL


class UserService:
    """用户信息服务"""
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_student_id(self) -> Optional[str]:
        """获取学生 ID"""
        patterns = [
            r'bg\.form\.addInput\s*\(\s*form\s*,\s*["\']ids["\']\s*,\s*["\'](\d+)["\']\s*\)',
            r'["\']?ids["\']?\s*[:=]\s*["\'](\d+)["\']',
            r'name\s*=\s*"ids"\s+value\s*=\s*"(\d+)"',
            r'addInput\([^)]*"ids"[^)]*"(\d+)"\)',
        ]
        
        urls = [
            f"{JWXT_BASE_URL}/eams/courseTableForStd.action",
            f"{JWXT_BASE_URL}/eams/courseTableForStd!index.action",
        ]
        
        for url in urls:
            try:
                resp = self.session.get(url, timeout=15)
                for pattern in patterns:
                    match = re.search(pattern, resp.text, re.IGNORECASE)
                    if match:
                        return match.group(1)
            except Exception:
                continue
        
        return None
    
    def get_detail(self) -> Dict:
        """获取学生详细信息"""
        result = {
            "name": None,
            "student_code": None,
            "department": None,
            "major": None,
            "class_name": None,
            "grade": None,
        }
        
        try:
            resp = self.session.get(f"{JWXT_BASE_URL}/eams/stdDetail.action", timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            field_map = {
                "姓名": "name",
                "学号": "student_code",
                "院系": "department",
                "专业": "major",
                "所属班级": "class_name",
                "年级": "grade",
            }
            
            for table in soup.find_all("table"):
                for row in table.find_all("tr"):
                    cells = row.find_all(["td", "th"])
                    for i, cell in enumerate(cells):
                        text = cell.get_text(strip=True).rstrip("：:")
                        if text in field_map and i + 1 < len(cells):
                            key = field_map[text]
                            if not result[key]:
                                result[key] = cells[i + 1].get_text(strip=True)
        except Exception:
            pass
        
        return result
    
    def get_current_week(self) -> Dict:
        """获取当前周次和学期"""
        result = {"current_week": None, "semester_name": None}
        
        try:
            resp = self.session.get(f"{JWXT_BASE_URL}/eams/home!welcome.action", timeout=15)
            text = resp.text
            
            # 提取周次
            week_match = re.search(r'第\s*(\d+)\s*周', text)
            if week_match:
                result["current_week"] = int(week_match.group(1))
            
            # 提取学期
            sem_match = re.search(r'(\d{4}[-~–]\d{4})学年.*?第\s*(\d+)\s*学期', text)
            if sem_match:
                result["semester_name"] = f"{sem_match.group(1)}学年第{sem_match.group(2)}学期"
        except Exception:
            pass
        
        return result
    
    def get_info(self) -> Dict:
        """获取完整用户信息"""
        info = {
            "success": True,
            "student_id": self.get_student_id(),
        }
        
        detail = self.get_detail()
        info.update(detail)
        
        week_info = self.get_current_week()
        info.update(week_info)
        
        # 从 cookie 获取学期 ID
        for cookie in self.session.cookies:
            if cookie.name == "semester.id":
                info["current_semester"] = cookie.value
                break
        
        return info
