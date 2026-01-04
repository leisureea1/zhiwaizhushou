"""
应用配置
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用信息
    app_name: str = "XISU JwxtAPI Service"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # Session 缓存配置
    session_ttl: int = 7 * 24 * 3600  # 7 天
    session_max_size: int = 100
    session_cache_file: str = "data/sessions.json"
    
    # 登录相关
    login_error_keywords: list[str] = [
        "登录", "统一身份认证", "未登录", "请确认已登录", 
        "会话过期", "session", "expired"
    ]
    
    class Config:
        env_file = ".env"
        env_prefix = "JWXT_"


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
