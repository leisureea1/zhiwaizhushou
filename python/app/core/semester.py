"""
学期信息服务
"""

import re
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup

from .constants import JWXT_BASE_URL


class SemesterService:
    """学期信息服务"""
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_current_id(self) -> Optional[str]:
        """获取当前学期 ID"""
        # 1. 从 cookie 获取
        for cookie in self.session.cookies:
            if cookie.name == "semester.id":
                return cookie.value
        
        # 2. 从页面提取
        urls = [
            f"{JWXT_BASE_URL}/eams/courseTableForStd.action",
            f"{JWXT_BASE_URL}/eams/home.action",
            f"{JWXT_BASE_URL}/eams/teach/grade/course/person!search.action",
        ]
        
        patterns = [
            r'semester\.id["\']?\s*[:=]\s*["\']?(\d+)',
            r'semesterId["\']?\s*[:=]\s*["\']?(\d+)',
            r'id="semester"[^>]*value="(\d+)"',
            r'name="semester\.id"[^>]*value="(\d+)"',
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
        
        # 3. 从 dataQuery 接口获取带 selected 标记的学期
        try:
            resp = self.session.post(
                f"{JWXT_BASE_URL}/eams/dataQuery.action",
                data={"dataType": "semester"},
                timeout=15
            )
            soup = BeautifulSoup(resp.text, "html.parser")
            # 查找 selected 属性的 option
            selected = soup.find("option", selected=True)
            if selected and selected.get("value", "").strip().isdigit():
                return selected.get("value").strip()
        except Exception:
            pass
        
        return None
    
    def get_available(self) -> Dict:
        """获取可用学期列表"""
        try:
            # 通过 dataQuery 接口获取学期列表
            resp = self.session.post(
                f"{JWXT_BASE_URL}/eams/dataQuery.action",
                data={"dataType": "semester"},
                timeout=15
            )
            
            semesters = []
            current = None
            
            # 解析 option 标签
            soup = BeautifulSoup(resp.text, "html.parser")
            for option in soup.find_all("option"):
                sem_id = option.get("value", "").strip()
                if sem_id and sem_id.isdigit():
                    sem = {"id": sem_id, "name": option.get_text(strip=True)}
                    if option.get("selected") is not None:
                        sem["current"] = True
                        current = sem_id
                    semesters.append(sem)
            
            # 如果没从 selected 属性找到当前学期，用 get_current_id 兜底
            if not current:
                current = self.get_current_id()
                for sem in semesters:
                    if sem["id"] == current:
                        sem["current"] = True
            
            # 按学年倒序排列（最新的在前面）
            semesters.reverse()
            
            return {
                "success": True,
                "semesters": semesters,
                "current_semester": current,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "semesters": [],
            }
    
    def get_info(self) -> Dict:
        """获取学期详细信息"""
        available = self.get_available()
        
        return {
            "success": True,
            "current_semester_id": available.get("current_semester"),
            "semesters": available.get("semesters", []),
        }
