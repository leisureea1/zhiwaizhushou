"""
学期信息服务
"""

import re
import json
from typing import Dict, Optional, List
import requests
from bs4 import BeautifulSoup

from .constants import JWXT_BASE_URL


class SemesterService:
    """学期信息服务"""
    
    # 默认学期列表（备用）
    DEFAULT_SEMESTERS = [
        {"id": "209", "name": "2025-2026学年第1学期"},
        {"id": "208", "name": "2024-2025学年第2学期"},
        {"id": "207", "name": "2024-2025学年第1学期"},
        {"id": "206", "name": "2023-2024学年第2学期"},
        {"id": "205", "name": "2023-2024学年第1学期"},
    ]
    
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
            resp = self.session.get(f"{JWXT_BASE_URL}/eams/courseTableForStd.action", timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            current = self.get_current_id()
            semesters = []
            
            # 从下拉框提取
            select = soup.find("select", {"id": "semester_id"}) or soup.find("select", {"name": "semester.id"})
            if select:
                for option in select.find_all("option"):
                    sem_id = option.get("value", "").strip()
                    if sem_id and sem_id.isdigit():
                        sem = {"id": sem_id, "name": option.get_text(strip=True)}
                        if sem_id == current:
                            sem["current"] = True
                        semesters.append(sem)
            
            if not semesters:
                semesters = self.DEFAULT_SEMESTERS.copy()
                if current:
                    for sem in semesters:
                        if sem["id"] == current:
                            sem["current"] = True
            
            return {
                "success": True,
                "semesters": semesters,
                "current_semester": current,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "semesters": self.DEFAULT_SEMESTERS,
            }
    
    def get_info(self) -> Dict:
        """获取学期详细信息"""
        current_id = self.get_current_id() or "209"
        available = self.get_available()
        
        return {
            "success": True,
            "current_semester_id": current_id,
            "semesters": available.get("semesters", []),
        }
