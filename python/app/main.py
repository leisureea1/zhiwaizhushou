"""
FastAPI 应用主入口

启动:
    cd python
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import get_settings
from .routers import (
    auth_router,
    course_router,
    grade_router,
    semester_router,
    user_router,
    cache_router,
    exam_router
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="西外教务系统 API 服务",
)

# 注册路由
app.include_router(auth_router)
app.include_router(course_router)
app.include_router(grade_router)
app.include_router(semester_router)
app.include_router(user_router)
app.include_router(cache_router)
app.include_router(exam_router)

# 静态文件
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    """测试页面"""
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
