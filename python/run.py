#!/usr/bin/env python3
"""
启动脚本 - 兼容旧的启动方式

使用方法:
    python run.py
    
或者使用 uvicorn:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
