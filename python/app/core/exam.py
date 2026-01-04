"""
考试信息服务
"""

import re
from typing import Dict, List
import requests
from bs4 import BeautifulSoup

from .constants import JWXT_BASE_URL, DEFAULT_HEADERS


class ExamService:
    """考试信息服务"""
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_exams(self, semester_id: str = None) -> Dict:
        """获取考试安排"""
        try:
            url = f"{JWXT_BASE_URL}/eams/stdExamTable!examTable.action"
            
            params = {}
            if semester_id:
                params['semester.id'] = semester_id
            
            resp = self.session.get(url, params=params, timeout=15)
            resp.raise_for_status()
            
            # 检查是否需要登录
            if "用户名" in resp.text and "密码" in resp.text:
                return {"success": False, "error": "需要重新登录"}
            
            exams = self._parse(resp.text)
            
            return {
                "success": True,
                "exams": exams,
                "total": len(exams),
                "semester_id": semester_id,
            }
        except Exception as e:
            return {"success": False, "error": str(e), "exams": []}
    
    def _parse(self, html: str) -> List[Dict]:
        """解析考试表格"""
        soup = BeautifulSoup(html, "html.parser")
        exams = []
        
        # 查找考试表格
        tables = soup.find_all("table")
        
        for table in tables:
            headers = table.find_all("th")
            if not headers:
                continue
            
            header_texts = [th.get_text(strip=True) for th in headers]
            
            # 检查是否是考试表格（包含"课程"或"考试"关键词）
            if not any(k in ''.join(header_texts) for k in ["课程", "考试", "时间", "地点"]):
                continue
            
            # 解析数据行
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if not cells:
                    continue
                
                values = [c.get_text(strip=True) for c in cells]
                if not any(values):
                    continue
                
                exam = {"id": len(exams) + 1}
                
                for j, val in enumerate(values):
                    if j < len(header_texts) and header_texts[j]:
                        exam[header_texts[j]] = val
                
                # 尝试提取标准字段
                exam_info = self._extract_exam_info(exam)
                exam.update(exam_info)
                
                if len(exam) > 1:
                    exams.append(exam)
            
            if exams:
                break
        
        return exams
    
    def _extract_exam_info(self, raw: Dict) -> Dict:
        """提取标准化的考试信息"""
        info = {}
        
        # 课程名称
        for key in ["课程名称", "课程", "科目"]:
            if key in raw and raw[key]:
                info["course_name"] = raw[key]
                break
        
        # 考试日期
        for key in ["考试日期", "日期"]:
            if key in raw and raw[key] and raw[key] != "时间未安排":
                info["exam_date"] = raw[key]
                break
        
        # 考试时间（考试安排字段）
        for key in ["考试安排", "考试时间", "时间"]:
            if key in raw and raw[key] and raw[key] != "时间未安排":
                time_str = raw[key]
                # 尝试解析时间范围 08:00~09:40
                time_match = re.search(r'(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})', time_str)
                if time_match:
                    info["start_time"] = time_match.group(1)
                    info["end_time"] = time_match.group(2)
                    # 组合完整考试时间
                    if "exam_date" in info:
                        info["exam_time"] = f"{info['exam_date']} {info['start_time']}-{info['end_time']}"
                    else:
                        info["exam_time"] = time_str
                else:
                    info["exam_time"] = time_str
                break
        
        # 如果有日期但没有时间，也设置 exam_time
        if "exam_date" in info and "exam_time" not in info:
            info["exam_time"] = info["exam_date"]
        
        # 考试地点
        for key in ["考试地点", "地点", "教室", "考场"]:
            if key in raw and raw[key] and raw[key] != "地点未安排":
                info["location"] = raw[key]
                break
        
        # 座位号
        for key in ["座位号", "座位", "座号"]:
            if key in raw and raw[key]:
                info["seat"] = raw[key]
                break
        
        # 考试类型/类别
        for key in ["考试类别", "考试类型", "类型", "考核方式"]:
            if key in raw and raw[key]:
                info["exam_type"] = raw[key]
                break
        
        # 考试情况
        if "考试情况" in raw and raw["考试情况"]:
            info["status"] = raw["考试情况"]
        
        return info
