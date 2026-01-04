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
        # 从 cookie 获取
        for cookie in self.session.cookies:
            if cookie.name == "semester.id":
                return cookie.value
        
        # 从页面提取
        urls = [
            f"{JWXT_BASE_URL}/eams/courseTableForStd.action",
            f"{JWXT_BASE_URL}/eams/home.action",
        ]
        
        patterns = [
            r'semester\.id["\']?\s*[:=]\s*["\']?(\d+)',
            r'semesterId["\']?\s*[:=]\s*["\']?(\d+)',
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
    
    def get_available(self) -> Dict:
        """获取可用学期列表"""
        try:
            # 通过 dataQuery 接口获取学期列表
            resp = self.session.post(
                f"{JWXT_BASE_URL}/eams/dataQuery.action",
                data={"dataType": "semester"},
                timeout=15
            )
            
            current = self.get_current_id()
            semesters = []
            
            # 解析 option 标签
            soup = BeautifulSoup(resp.text, "html.parser")
            for option in soup.find_all("option"):
                sem_id = option.get("value", "").strip()
                if sem_id and sem_id.isdigit():
                    sem = {"id": sem_id, "name": option.get_text(strip=True)}
                    if sem_id == current:
                        sem["current"] = True
                    semesters.append(sem)
            
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
        current_id = self.get_current_id()
        available = self.get_available()
        
        return {
            "success": True,
            "current_semester_id": current_id,
            "semesters": available.get("semesters", []),
        }
