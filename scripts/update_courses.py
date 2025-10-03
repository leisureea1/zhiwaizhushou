#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
定时更新课程数据脚本
该脚本会定期调用教务系统爬虫更新所有用户的课程和成绩数据
"""

import os
import sys
import subprocess
import json
import logging
from datetime import datetime

# 添加项目路径到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/update_courses.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_crawler_for_all_users():
    """
    为所有用户运行爬虫更新课程数据
    """
    try:
        # 这里应该从数据库获取所有用户信息
        # 为演示目的，我们使用示例数据
        users = [
            {
                "user_id": 1,
                "student_id": "2021001",
                "edu_username": "student1",
                "edu_password": "password1"
            },
            {
                "user_id": 2,
                "student_id": "2021002",
                "edu_username": "student2",
                "edu_password": "password2"
            }
        ]
        
        logging.info(f"开始更新 {len(users)} 个用户的课程数据")
        
        for user in users:
            try:
                logging.info(f"正在更新用户 {user['student_id']} 的课程数据")
                
                # 调用爬虫脚本
                crawler_script = os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    'python', 'crawler', 'edu_crawler.py'
                )
                
                cmd = [
                    sys.executable, crawler_script,
                    '--username', user['edu_username'],
                    '--password', user['edu_password'],
                    '--user-id', str(user['user_id']),
                    '--action', 'all'
                ]
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5分钟超时
                )
                
                if result.returncode == 0:
                    logging.info(f"用户 {user['student_id']} 的课程数据更新成功")
                else:
                    logging.error(f"用户 {user['student_id']} 的课程数据更新失败: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                logging.error(f"用户 {user['student_id']} 的课程数据更新超时")
            except Exception as e:
                logging.error(f"用户 {user['student_id']} 的课程数据更新出错: {str(e)}")
                
        logging.info("所有用户的课程数据更新完成")
        
    except Exception as e:
        logging.error(f"更新课程数据时出错: {str(e)}")

if __name__ == "__main__":
    logging.info("定时更新课程数据脚本启动")
    run_crawler_for_all_users()
    logging.info("定时更新课程数据脚本结束")