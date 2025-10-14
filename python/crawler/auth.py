#!/usr/bin/env python3
"""CAS 认证模块 - 处理登录和Cookie管理"""

from __future__ import annotations

import base64
import json
import re
from pathlib import Path
from typing import Dict
from urllib.parse import urljoin, quote_plus
from http.cookies import SimpleCookie

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


# 常量定义
CAS_LOGIN_URL = "https://login.xisu.edu.cn/cas/login"
CAS_PUBLIC_KEY_URL = "https://login.xisu.edu.cn/cas/jwt/publicKey"
JWXT_HOME_URL = "https://jwxt.xisu.edu.cn/eams/home.action"
JWXT_SSO_URL = "https://jwxt.xisu.edu.cn/eams/sso/login.action"
PORTAL_ENTRY_URL = "https://wsbsdt.xisu.edu.cn/page/site/index"
PORTAL_CAS_REDIRECT = "https://wsbsdt.xisu.edu.cn/common/actionCasLogin"
PORTAL_DEFAULT_REDIRECT = "https://wsbsdt.xisu.edu.cn/page/site/visitor"
REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}

_PUBLIC_KEY_CACHE: Dict[str, rsa.RSAPublicKey] = {}


class AuthError(Exception):
    """认证相关异常"""
    pass


def get_public_key(session: requests.Session) -> rsa.RSAPublicKey:
    """获取并缓存CAS RSA公钥"""
    cache_key = "cas_public_key"
    
    if cache_key in _PUBLIC_KEY_CACHE:
        return _PUBLIC_KEY_CACHE[cache_key]
    
    resp = session.get(CAS_PUBLIC_KEY_URL, timeout=10)
    resp.raise_for_status()
    
    public_key = serialization.load_pem_public_key(resp.content)
    if not isinstance(public_key, rsa.RSAPublicKey):
        raise AuthError("CAS public key is not RSA")
    
    _PUBLIC_KEY_CACHE[cache_key] = public_key
    return public_key


def encrypt_password(session: requests.Session, plaintext: str) -> str:
    """使用RSA公钥加密密码"""
    public_key = get_public_key(session)
    ciphertext = public_key.encrypt(
        plaintext.encode("utf-8"),
        padding.PKCS1v15(),
    )
    return "__RSA__" + base64.b64encode(ciphertext).decode("ascii")


def extract_hidden_form_values(html: str) -> Dict[str, str]:
    """提取登录表单隐藏字段"""
    soup = BeautifulSoup(html, "html.parser")
    
    form = soup.find(id="fm1")
    if form is None:
        candidates = soup.find_all("form")
        for candidate in candidates:
            action = candidate.get("action", "")
            if "login" in action:
                form = candidate
                break
        if form is None and candidates:
            form = candidates[0]
    
    if form is None:
        raise AuthError("无法找到登录表单")
    
    hidden_inputs = {}
    for input_el in form.find_all("input"):
        input_type = input_el.get("type", "text").lower()
        if input_type in {"hidden", "submit"}:
            name = input_el.get("name")
            value = input_el.get("value", "")
            if name:
                hidden_inputs[name] = value
    
    return hidden_inputs


def extract_execution_from_html(html: str) -> str | None:
    """从HTML中提取execution字段"""
    soup = BeautifulSoup(html, "html.parser")
    input_el = soup.find("input", attrs={"name": "execution"})
    if input_el is not None:
        value = input_el.get("value", "")
        if value:
            return value
    
    m = re.search(
        r'name\s*=\s*[\"\']execution[\"\']\s+[^>]*value\s*=\s*[\"\']([^\"\']+)[\"\']',
        html,
        re.IGNORECASE
    )
    if m:
        return m.group(1)
    return None


def perform_cas_login(username: str, password: str) -> requests.Session:
    """
    执行CAS登录，返回已登录的session
    
    Args:
        username: 学号/工号
        password: 密码
        
    Returns:
        已登录的requests.Session对象
        
    Raises:
        AuthError: 登录失败时抛出
    """
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0 Safari/537.36"
        )
    })
    
    try:
        # Step 0A: 访问门户入口
        portal_resp = session.get(PORTAL_ENTRY_URL, timeout=15)
        portal_resp.raise_for_status()
        
        # Step 0B: 门户CAS登录初始化
        portal_params = {
            "service": f"{PORTAL_CAS_REDIRECT}?redirect_url={quote_plus(PORTAL_DEFAULT_REDIRECT)}"
        }
        portal_login_page = session.get(CAS_LOGIN_URL, params=portal_params, timeout=15)
        portal_login_page.raise_for_status()
        
        try:
            portal_hidden = extract_hidden_form_values(portal_login_page.text)
        except AuthError:
            portal_hidden = {}
        
        execution_token = portal_hidden.get("execution")
        if execution_token:
            portal_payload: Dict[str, str] = {}
            for key, value in portal_hidden.items():
                if key in {"username", "password"}:
                    continue
                portal_payload[key] = value
            
            portal_payload.update({
                "username": username,
                "password": encrypt_password(session, password),
                "_eventId": portal_hidden.get("_eventId", "submit"),
                "execution": execution_token,
            })
            if "rememberMe" in portal_hidden:
                portal_payload["rememberMe"] = portal_payload.get("rememberMe") or "true"
            
            portal_login_resp = session.post(
                portal_login_page.url,
                data=portal_payload,
                timeout=15,
                allow_redirects=False,
            )
            portal_login_resp.raise_for_status()
            
            if portal_login_resp.status_code in REDIRECT_STATUS_CODES:
                portal_ticket_url = urljoin(
                    portal_login_resp.url,
                    portal_login_resp.headers.get("Location", "")
                )
                if portal_ticket_url:
                    portal_ticket_resp = session.get(
                        portal_ticket_url,
                        timeout=15,
                        allow_redirects=False
                    )
                    portal_ticket_resp.raise_for_status()
                    if portal_ticket_resp.status_code in REDIRECT_STATUS_CODES:
                        final_portal_url = urljoin(
                            portal_ticket_resp.url,
                            portal_ticket_resp.headers.get("Location", "")
                        )
                        if final_portal_url:
                            session.get(final_portal_url, timeout=15)
        
        # Step 1: 访问JWXT SSO入口
        entry_resp = session.get(JWXT_SSO_URL, timeout=15, allow_redirects=False)
        
        encoded_target = "base64" + base64.b64encode(JWXT_HOME_URL.encode("utf-8")).decode("ascii")
        service_with_target = f"{JWXT_SSO_URL}?targetUrl={encoded_target}"
        
        # 检查是否已经登录
        if entry_resp.status_code == 200 and "教务管理系统" in entry_resp.text:
            return session
        
        cas_login_url = entry_resp.headers.get("Location")
        if cas_login_url:
            cas_login_url = urljoin(JWXT_SSO_URL, cas_login_url)
        else:
            cas_login_url = CAS_LOGIN_URL
        
        login_params = {"service": service_with_target}
        
        initial_resp = session.get(cas_login_url, params=login_params, timeout=15)
        initial_resp.raise_for_status()
        
        # 再次检查是否直接跳转到教务系统
        if "教务管理系统" in initial_resp.text:
            return session
        
        form_action = initial_resp.url
        
        hidden_values = extract_hidden_form_values(initial_resp.text)
        if "execution" not in hidden_values or not hidden_values.get("execution"):
            exec_fallback = extract_execution_from_html(initial_resp.text)
            if exec_fallback:
                hidden_values["execution"] = exec_fallback
        
        # 多次尝试获取execution字段
        if "execution" not in hidden_values or not hidden_values.get("execution"):
            retry_resp = session.get(CAS_LOGIN_URL, params=login_params, timeout=15)
            try_exec = extract_execution_from_html(retry_resp.text)
            if try_exec:
                hidden_values["execution"] = try_exec
            else:
                plain_resp = session.get(CAS_LOGIN_URL, timeout=15)
                plain_exec = extract_execution_from_html(plain_resp.text)
                if plain_exec:
                    hidden_values["execution"] = plain_exec
        
        if "execution" not in hidden_values or not hidden_values.get("execution"):
            raise AuthError("无法获取execution字段，登录表单可能已改变")
        
        encrypted_password = encrypt_password(session, password)
        
        # 构造POST请求参数
        payload: Dict[str, str] = {}
        for key, value in hidden_values.items():
            if key in {"username", "password"}:
                continue
            payload[key] = value
        
        payload.update({
            "username": username,
            "password": encrypted_password,
            "_eventId": hidden_values.get("_eventId", "submit"),
            "execution": hidden_values["execution"],
            "geolocation": hidden_values.get("geolocation", ""),
        })
        
        if "rememberMe" in hidden_values:
            payload["rememberMe"] = payload.get("rememberMe") or "true"
        
        if "lt" in hidden_values:
            payload["lt"] = hidden_values["lt"]
        
        login_resp = session.post(
            form_action,
            data=payload,
            timeout=15,
            allow_redirects=False,
        )
        login_resp.raise_for_status()
        
        if login_resp.status_code not in REDIRECT_STATUS_CODES:
            if "credentialError" in login_resp.text or "无效" in login_resp.text:
                raise AuthError("用户名或密码错误")
            raise AuthError("登录失败，未返回预期的跳转")
        
        ticket_location = login_resp.headers.get("Location")
        if not ticket_location:
            raise AuthError("登录成功但未获取到ticket")
        
        ticket_url = urljoin(login_resp.url, ticket_location)
        
        # 携带ticket访问教务SSO
        sso_resp = session.get(ticket_url, timeout=15, allow_redirects=False)
        sso_resp.raise_for_status()
        
        # 处理Set-Cookie
        raw_set_cookies = []
        if hasattr(sso_resp.raw, "headers"):
            try:
                raw_set_cookies = sso_resp.raw.headers.get_all("Set-Cookie") or []
            except AttributeError:
                raw_set_cookies = []
        
        for cookie_str in raw_set_cookies:
            cookie = SimpleCookie()
            cookie.load(cookie_str)
            for morsel in cookie.values():
                key = morsel.key
                value = morsel.value
                domain = morsel["domain"] or "jwxt.xisu.edu.cn"
                path = morsel["path"] or "/"
                session.cookies.set(key, value, domain=domain, path=path)
        
        if sso_resp.status_code in REDIRECT_STATUS_CODES:
            next_location = sso_resp.headers.get("Location")
            if next_location:
                final_url = urljoin(sso_resp.url, next_location)
                session.get(final_url, timeout=15)
        
        return session
        
    except requests.RequestException as e:
        raise AuthError(f"网络请求失败: {e}") from e
    except Exception as e:
        raise AuthError(f"登录过程出错: {e}") from e


def save_cookies(session: requests.Session, output_path: str | Path) -> None:
    """
    保存session的cookies到文件
    
    Args:
        output_path: cookie文件路径，可以是相对路径或绝对路径
                     如果只提供文件名，会自动保存到cookies文件夹
    """
    output_path = Path(output_path)
    
    # 如果只是文件名（没有父目录），保存到cookies文件夹
    if output_path.parent == Path('.'):
        cookies_dir = Path(__file__).parent / 'cookies'
        cookies_dir.mkdir(exist_ok=True)
        output_path = cookies_dir / output_path.name
    else:
        # 如果指定了目录，确保目录存在
        output_path.parent.mkdir(parents=True, exist_ok=True)
    
    cookies_data = {}
    for cookie in session.cookies:
        cookies_data[cookie.name] = {
            "value": cookie.value,
            "domain": cookie.domain,
            "path": cookie.path
        }
    
    simple_cookies = session.cookies.get_dict()
    
    full_data = {
        "simple": simple_cookies,
        "detailed": cookies_data
    }
    
    output_path.write_text(json.dumps(full_data, indent=2, ensure_ascii=False))


def load_cookies(cookie_path: str | Path) -> requests.Session:
    """
    从文件加载cookies并创建session
    
    Args:
        cookie_path: cookie文件路径，可以是相对路径或绝对路径
                     如果只提供文件名，会自动从cookies文件夹加载
    """
    cookie_path = Path(cookie_path)
    
    # 如果只是文件名（没有父目录），从cookies文件夹加载
    if cookie_path.parent == Path('.'):
        cookies_dir = Path(__file__).parent / 'cookies'
        cookie_path = cookies_dir / cookie_path.name
    
    if not cookie_path.exists():
        raise AuthError(f"Cookie文件不存在: {cookie_path}")
    
    data = json.loads(cookie_path.read_text())
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0 Safari/537.36"
        )
    })
    
    # 优先使用detailed格式
    if "detailed" in data:
        for name, info in data["detailed"].items():
            session.cookies.set(
                name,
                info["value"],
                domain=info.get("domain"),
                path=info.get("path", "/")
            )
    elif "simple" in data:
        for name, value in data["simple"].items():
            session.cookies.set(name, value)
    else:
        # 兼容旧格式
        for name, value in data.items():
            session.cookies.set(name, value)
    
    return session


def login_and_get_cookies(username: str, password: str, save_path: str | Path = None) -> Dict[str, any]:
    """
    登录并获取cookies
    
    Args:
        username: 学号
        password: 密码
        save_path: 可选，保存cookies的路径
        
    Returns:
        包含session和cookies信息的字典
    """
    try:
        session = perform_cas_login(username, password)
        
        cookies_dict = session.cookies.get_dict()
        
        result = {
            "success": True,
            "session": session,
            "cookies": cookies_dict,
            "message": "登录成功"
        }
        
        if save_path:
            save_cookies(session, save_path)
            result["cookie_file"] = str(Path(save_path).resolve())
        
        return result
        
    except AuthError as e:
        # 尝试从底层异常中提取HTTP细节
        detail: Dict[str, any] = {"type": type(e).__name__}
        cause = getattr(e, "__cause__", None) or getattr(e, "__context__", None)
        try:
            import requests  # type: ignore
            if isinstance(cause, requests.HTTPError):
                resp = cause.response
                if resp is not None:
                    detail.update({
                        "http_status": resp.status_code,
                        "url": resp.url,
                        "response_headers": dict(resp.headers),
                        "response_text_snippet": resp.text[:800] if isinstance(resp.text, str) else str(resp.content)[:800],
                    })
                    req = resp.request
                    if req is not None:
                        detail.update({
                            "request_method": getattr(req, 'method', ''),
                            "request_url": getattr(req, 'url', ''),
                            "request_headers": dict(getattr(req, 'headers', {})),
                        })
            elif isinstance(cause, requests.RequestException):
                detail.update({
                    "request_exception": str(cause),
                })
        except Exception:
            pass

        return {
            "success": False,
            "error": str(e),
            "message": "登录失败",
            "error_detail": detail,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "未知错误"
        }
