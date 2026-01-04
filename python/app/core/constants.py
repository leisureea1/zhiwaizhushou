"""
常量定义
"""

# CAS 认证相关
CAS_LOGIN_URL = "https://login.xisu.edu.cn/cas/login"
CAS_PUBLIC_KEY_URL = "https://login.xisu.edu.cn/cas/jwt/publicKey"

# 教务系统相关
JWXT_BASE_URL = "https://jwxt.xisu.edu.cn"
JWXT_HOME_URL = f"{JWXT_BASE_URL}/eams/home.action"
JWXT_SSO_URL = f"{JWXT_BASE_URL}/eams/sso/login.action"

# 门户相关
PORTAL_ENTRY_URL = "https://wsbsdt.xisu.edu.cn/page/site/index"
PORTAL_CAS_REDIRECT = "https://wsbsdt.xisu.edu.cn/common/actionCasLogin"
PORTAL_DEFAULT_REDIRECT = "https://wsbsdt.xisu.edu.cn/page/site/visitor"

# HTTP 重定向状态码
REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}

# 默认请求头
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0 Safari/537.36"
    )
}

# 课程时间表
TIME_SLOTS = {
    0: ("08:00", "08:50"),
    1: ("09:00", "09:50"),
    2: ("10:10", "11:00"),
    3: ("11:10", "12:00"),
    4: ("12:00", "14:00"),
    5: ("14:00", "14:50"),
    6: ("15:00", "15:50"),
    7: ("16:10", "17:00"),
    8: ("17:10", "18:00"),
    9: ("18:00", "19:10"),
    10: ("19:10", "20:00"),
    11: ("20:10", "21:00"),
}

WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
