"""
评教服务模块
"""

import re
import json
import time
import logging
from typing import Dict, List, Optional

from bs4 import BeautifulSoup
import requests

logger = logging.getLogger(__name__)


class EvaluationService:
    """评教服务"""
    
    BASE_URL = "https://jwxt.xisu.edu.cn"
    EVAL_LIST_URL = f"{BASE_URL}/eams/quality/stdEvaluate.action"
    EVAL_ANSWER_URL = f"{BASE_URL}/eams/quality/stdEvaluate!answer.action"
    EVAL_SUBMIT_URL = f"{BASE_URL}/eams/quality/stdEvaluate!finishAnswer.action"
    
    def __init__(self, session: requests.Session):
        self.session = session
    
    def get_pending_evaluations(self) -> Dict:
        """获取待评教列表"""
        try:
            resp = self.session.get(self.EVAL_LIST_URL, timeout=30)
            if resp.status_code != 200:
                return {"success": False, "error": f"获取评教列表失败，状态码: {resp.status_code}"}
            
            soup = BeautifulSoup(resp.text, "html.parser")
            eval_links = soup.find_all("a", href=re.compile(r"stdEvaluate!answer\.action"))
            
            evaluations = []
            for link in eval_links:
                href = link.get("href", "")
                match = re.search(r"evaluationLesson\.id=(\d+)", href)
                if not match:
                    continue
                
                lesson_id = match.group(1)
                
                # 获取教师名和课程信息
                span = link.find("span", class_="eval")
                teacher_name = span.get_text(strip=True) if span else "未知教师"
                teacher_name = teacher_name.replace("(进行评教)", "").strip()
                
                # 从表格行获取课程信息
                tr = link.find_parent("tr")
                course_code = ""
                course_name = ""
                course_type = ""
                if tr:
                    tds = tr.find_all("td")
                    if len(tds) >= 3:
                        course_code = tds[0].get_text(strip=True)
                        course_name = tds[1].get_text(strip=True)
                        course_type = tds[2].get_text(strip=True)
                
                evaluations.append({
                    "lesson_id": lesson_id,
                    "teacher_name": teacher_name,
                    "course_code": course_code,
                    "course_name": course_name,
                    "course_type": course_type,
                })
            
            return {
                "success": True,
                "total": len(evaluations),
                "evaluations": evaluations
            }
        except Exception as e:
            logger.error(f"获取待评教列表失败: {e}")
            return {"success": False, "error": str(e)}
    
    def get_questionnaire(self, lesson_id: str) -> Optional[Dict]:
        """获取评教问卷内容"""
        url = f"{self.EVAL_ANSWER_URL}?evaluationLesson.id={lesson_id}"
        resp = self.session.get(url, timeout=30)
        
        if resp.status_code != 200:
            return None
        
        # 提取 QUESTIONS JSON
        match = re.search(r"QUESTIONS\s*=\s*new\s+Questions\(eval\('(\[.*?\])'\)\)", resp.text, re.DOTALL)
        if not match:
            return None
        
        try:
            json_str = match.group(1).replace('\\"', '"').replace('\\\\', '\\')
            questions = json.loads(json_str)
        except json.JSONDecodeError:
            return None
        
        # 提取 semester.id
        semester_match = re.search(r'name="semester\.id"\s+value="(\d+)"', resp.text)
        semester_id = semester_match.group(1) if semester_match else "209"
        
        return {
            "lesson_id": lesson_id,
            "semester_id": semester_id,
            "questions": questions
        }
    
    def submit_evaluation(self, lesson_id: str, semester_id: str, 
                          questions: List[Dict], choice_index: int = 0,
                          comment: str = "无") -> Dict:
        """
        提交评教
        
        Args:
            lesson_id: 评教课程 ID
            semester_id: 学期 ID
            questions: 问题列表
            choice_index: 选项索引 (0=完全符合, 1=符合, 2=基本符合, 3=基本不符合, 4=完全不符合)
            comment: 建议留言
        
        Returns:
            提交结果
        """
        post_data = {
            "evaluationLesson.id": lesson_id,
            "semester.id": semester_id,
            "teacher.id": "",
        }
        
        seed = 100
        result1_idx = 0
        result2_idx = 0
        
        for q in questions:
            if q.get("type") == "subtitle":
                continue
            
            q_id = q.get("id")
            if not q_id:
                continue
            
            options = q.get("options", [])
            proportion = q.get("proportion", 0.05)
            question_name = q.get("name", "")
            question_type = q.get("questionType", "")
            
            if options:
                if choice_index < len(options):
                    selected = options[choice_index]
                    option_name = selected.get("name", "")
                    option_proportion = selected.get("proportion", 1)
                    score = proportion * option_proportion * seed
                    
                    post_data[f"result1_{result1_idx}.questionName"] = question_name
                    post_data[f"result1_{result1_idx}.questionType"] = question_type
                    post_data[f"result1_{result1_idx}.content"] = option_name
                    post_data[f"result1_{result1_idx}.score"] = str(score)
                    result1_idx += 1
            else:
                post_data[f"result2_{result2_idx}.questionName"] = question_name
                post_data[f"result2_{result2_idx}.questionType"] = question_type
                post_data[f"result2_{result2_idx}.content"] = comment
                result2_idx += 1
        
        post_data["result1Num"] = str(result1_idx)
        post_data["result2Num"] = str(result2_idx)
        
        resp = self.session.post(self.EVAL_SUBMIT_URL, data=post_data, timeout=30)
        
        if resp.status_code == 200:
            if "成功" in resp.text or "完成" in resp.text or len(resp.text.strip()) < 500:
                return {"success": True, "message": "评教提交成功"}
            else:
                return {"success": True, "message": "已提交"}
        else:
            return {"success": False, "error": f"提交失败，状态码: {resp.status_code}"}
    
    def evaluate_single(self, lesson_id: str, choice_index: int = 0, 
                        comment: str = "无") -> Dict:
        """评教单个课程"""
        questionnaire = self.get_questionnaire(lesson_id)
        if not questionnaire:
            return {"success": False, "error": "获取问卷失败"}
        
        return self.submit_evaluation(
            lesson_id=lesson_id,
            semester_id=questionnaire["semester_id"],
            questions=questionnaire["questions"],
            choice_index=choice_index,
            comment=comment
        )
    
    def evaluate_all(self, choice_index: int = 0, comment: str = "无") -> Dict:
        """自动评教所有待评课程"""
        results = {
            "success": True,
            "total": 0,
            "succeeded": 0,
            "failed": 0,
            "details": []
        }
        
        # 获取待评教列表
        pending = self.get_pending_evaluations()
        if not pending.get("success"):
            return pending
        
        evaluations = pending.get("evaluations", [])
        results["total"] = len(evaluations)
        
        if not evaluations:
            results["message"] = "没有待评教的课程"
            return results
        
        for eval_info in evaluations:
            lesson_id = eval_info["lesson_id"]
            course = f"{eval_info['course_code']} {eval_info['course_name']}"
            teacher = eval_info['teacher_name']
            
            result = self.evaluate_single(lesson_id, choice_index, comment)
            
            detail = {
                "lesson_id": lesson_id,
                "course": course,
                "teacher": teacher,
                "success": result.get("success", False),
                "message": result.get("message") or result.get("error")
            }
            results["details"].append(detail)
            
            if result.get("success"):
                results["succeeded"] += 1
            else:
                results["failed"] += 1
            
            time.sleep(0.3)
        
        results["message"] = f"评教完成: {results['succeeded']}/{results['total']} 成功"
        return results
