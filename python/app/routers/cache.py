"""
缓存管理路由
"""

from fastapi import APIRouter

from ..services.session_cache import get_session_cache

router = APIRouter(prefix="/cache", tags=["缓存管理"])


@router.get("/stats")
async def cache_stats():
    """获取缓存统计信息"""
    return get_session_cache().get_stats()


@router.get("/info")
async def cache_info():
    """获取缓存详细信息"""
    return get_session_cache().get_cache_info()


@router.post("/clear")
async def cache_clear():
    """清空所有缓存"""
    get_session_cache().clear()
    return {"success": True, "message": "Cache cleared"}
