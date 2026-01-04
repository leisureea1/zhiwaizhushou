"""
成绩服务
"""

import time
from typing import Dict, List
import requests
from bs4 import BeautifulSoup

from .constants import JWXT_BASE_URL, DEFAULT_HEADERS


class GradeService:
    """成绩服务"""
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_grades(self, semester_id: str = None) -> Dict:
        """获取成绩"""
        if semester_id:
            return self._fetch(semester_id)
        
        # 尝试多个学期
        semesters = ["209", "208", "207", "206", "205"]
        
        for sem_id in semesters:
            result = self._fetch(sem_id)
            if result.get("success") and result.get("grades"):
                return result
        
        return {
            "success": True,
            "grades": [],
            "statistics": {},
            "message": "未找到成绩数据"
        }
    
    def _fetch(self, semester_id: str) -> Dict:
        """获取指定学期成绩"""
        try:
            headers = {
                **DEFAULT_HEADERS,
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": JWXT_BASE_URL,
            }
            
            data = {
                "semesterId": semester_id,
                "projectType": "",
                "_": str(int(time.time() * 1000)),
            }
            
            resp = self.session.post(
                f"{JWXT_BASE_URL}/eams/teach/grade/course/person!search.action",
                headers=headers, data=data, timeout=15
            )
            
            if "用户名" in resp.text and "密码" in resp.text:
                return {"success": False, "error": "需要重新登录"}
            
            grades = self._parse(resp.text)
            stats = self._calc_stats(grades)
            
            return {
                "success": True,
                "semester_id": semester_id,
                "grades": grades,
                "statistics": stats,
                "total_courses": len(grades),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "grades": []}
    
    def _parse(self, html: str) -> List[Dict]:
        """解析成绩表格"""
        soup = BeautifulSoup(html, "html.parser")
        grades = []
        
        for table in soup.find_all("table"):
            headers = table.find_all("th")
            if not headers or not any("课程" in th.get_text() for th in headers):
                continue
            
            header_texts = [th.get_text(strip=True) for th in headers if th.get_text(strip=True)]
            
            tbody = table.find("tbody")
            if not tbody:
                continue
            
            for row in tbody.find_all("tr"):
                cells = row.find_all(["td", "th"])
                values = [c.get_text(strip=True) for c in cells]
                
                if not any(values):
                    continue
                
                grade = {"id": len(grades) + 1}
                for j, val in enumerate(values):
                    if j < len(header_texts):
                        grade[header_texts[j]] = val
                
                if len(grade) > 1:
                    grades.append(grade)
            break
        
        return grades
    
    def _calc_stats(self, grades: List[Dict]) -> Dict:
        """计算统计信息"""
        stats = {
            "total_courses": len(grades),
            "average_score": None,
            "weighted_average": None,
            "total_credits": 0,
            "grade_distribution": {},
        }
        
        if not grades:
            return stats
        
        scores = []
        total_credits = 0
        weighted_sum = 0
        
        for g in grades:
            # 提取学分
            credits = 0
            if "学分" in g and g["学分"]:
                try:
                    credits = float(g["学分"])
                    total_credits += credits
                except (ValueError, TypeError):
                    pass
            
            # 提取成绩
            score = None
            for field in ["最终", "总评成绩", "成绩", "总评"]:
                if field in g and g[field]:
                    try:
                        val = str(g[field]).replace(".", "").replace("-", "")
                        if val.isdigit():
                            score = float(g[field])
                            break
                    except (ValueError, TypeError):
                        continue
            
            if score is not None:
                scores.append(score)
                if credits > 0:
                    weighted_sum += score * credits
        
        if scores:
            stats["average_score"] = round(sum(scores) / len(scores), 2)
            
            if total_credits > 0:
                stats["weighted_average"] = round(weighted_sum / total_credits, 2)
                stats["total_credits"] = total_credits
            
            # 分布统计
            dist = {"90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "60以下": 0}
            for s in scores:
                if s >= 90:
                    dist["90-100"] += 1
                elif s >= 80:
                    dist["80-89"] += 1
                elif s >= 70:
                    dist["70-79"] += 1
                elif s >= 60:
                    dist["60-69"] += 1
                else:
                    dist["60以下"] += 1
            stats["grade_distribution"] = dist
        
        return stats
