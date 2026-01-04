"""
CAS 认证模块
"""

import base64
import re
from typing import Dict, Optional
from urllib.parse import urljoin, quote_plus
from http.cookies import SimpleCookie

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from .constants import (
    CAS_LOGIN_URL, CAS_PUBLIC_KEY_URL,
    JWXT_HOME_URL, JWXT_SSO_URL,
    PORTAL_ENTRY_URL, PORTAL_CAS_REDIRECT, PORTAL_DEFAULT_REDIRECT,
    REDIRECT_STATUS_CODES, DEFAULT_HEADERS
)


class AuthError(Exception):
    """认证异常"""
    pass


class CASAuth:
    """CAS 认证服务"""
    
    _public_key_cache: Dict[str, rsa.RSAPublicKey] = {}
    
    def __init__(self):
        self.session: Optional[requests.Session] = None
    
    def _get_public_key(self, session: requests.Session) -> rsa.RSAPublicKey:
        """获取并缓存 RSA 公钥"""
        if "cas" in self._public_key_cache:
            return self._public_key_cache["cas"]
        
        resp = session.get(CAS_PUBLIC_KEY_URL, timeout=10)
        resp.raise_for_status()
        
        public_key = serialization.load_pem_public_key(resp.content)
        if not isinstance(public_key, rsa.RSAPublicKey):
            raise AuthError("CAS public key is not RSA")
        
        self._public_key_cache["cas"] = public_key
        return public_key
    
    def _encrypt_password(self, session: requests.Session, password: str) -> str:
        """RSA 加密密码"""
        public_key = self._get_public_key(session)
        ciphertext = public_key.encrypt(password.encode("utf-8"), padding.PKCS1v15())
        return "__RSA__" + base64.b64encode(ciphertext).decode("ascii")
    
    def _extract_form_values(self, html: str) -> Dict[str, str]:
        """提取表单隐藏字段"""
        soup = BeautifulSoup(html, "html.parser")
        form = soup.find(id="fm1") or soup.find("form", action=lambda x: x and "login" in x)
        
        if not form:
            forms = soup.find_all("form")
            form = forms[0] if forms else None
        
        if not form:
            raise AuthError("无法找到登录表单")
        
        values = {}
        for inp in form.find_all("input"):
            if inp.get("type", "").lower() in {"hidden", "submit"}:
                name = inp.get("name")
                if name:
                    values[name] = inp.get("value", "")
        return values
    
    def _extract_execution(self, html: str) -> Optional[str]:
        """提取 execution 字段"""
        soup = BeautifulSoup(html, "html.parser")
        inp = soup.find("input", attrs={"name": "execution"})
        if inp and inp.get("value"):
            return inp.get("value")
        
        match = re.search(
            r'name\s*=\s*["\']execution["\']\s+[^>]*value\s*=\s*["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        return match.group(1) if match else None

    def login(self, username: str, password: str) -> requests.Session:
        """执行 CAS 登录"""
        session = requests.Session()
        session.headers.update(DEFAULT_HEADERS)
        
        try:
            # 1. 访问门户初始化
            try:
                session.get(PORTAL_ENTRY_URL, timeout=15)
            except Exception:
                pass  # 门户访问失败不影响主流程
            
            # 2. 门户 CAS 登录
            portal_params = {"service": f"{PORTAL_CAS_REDIRECT}?redirect_url={quote_plus(PORTAL_DEFAULT_REDIRECT)}"}
            try:
                portal_page = session.get(CAS_LOGIN_URL, params=portal_params, timeout=15)
                portal_hidden = self._extract_form_values(portal_page.text)
                if portal_hidden.get("execution"):
                    self._do_portal_login(session, portal_page, portal_hidden, username, password)
            except Exception:
                pass  # 门户登录失败不影响主流程
            
            # 3. 教务系统 SSO 登录
            entry_resp = session.get(JWXT_SSO_URL, timeout=15, allow_redirects=False)
            
            if entry_resp.status_code == 200 and "教务管理系统" in entry_resp.text:
                self.session = session
                return session
            
            # 4. 获取 CAS 登录页面
            encoded_target = "base64" + base64.b64encode(JWXT_HOME_URL.encode()).decode()
            service_url = f"{JWXT_SSO_URL}?targetUrl={encoded_target}"
            
            cas_url = entry_resp.headers.get("Location")
            cas_url = urljoin(JWXT_SSO_URL, cas_url) if cas_url else CAS_LOGIN_URL
            
            login_page = session.get(cas_url, params={"service": service_url}, timeout=15)
            
            if "教务管理系统" in login_page.text:
                self.session = session
                return session
            
            # 5. 提取表单并登录
            try:
                hidden = self._extract_form_values(login_page.text)
            except AuthError:
                hidden = {}
            
            if not hidden.get("execution"):
                hidden["execution"] = self._extract_execution(login_page.text)
            
            if not hidden.get("execution"):
                # 重试获取
                retry = session.get(CAS_LOGIN_URL, params={"service": service_url}, timeout=15)
                hidden["execution"] = self._extract_execution(retry.text)
                if not hidden.get("execution"):
                    try:
                        hidden = self._extract_form_values(retry.text)
                    except AuthError:
                        pass
            
            if not hidden.get("execution"):
                raise AuthError("无法获取 execution 字段，CAS 登录页面可能已变更")
            
            # 6. 提交登录
            payload = {k: v for k, v in hidden.items() if k not in {"username", "password"}}
            payload.update({
                "username": username,
                "password": self._encrypt_password(session, password),
                "_eventId": hidden.get("_eventId", "submit"),
                "execution": hidden["execution"],
                "geolocation": hidden.get("geolocation", ""),
            })
            
            if "rememberMe" in hidden:
                payload["rememberMe"] = "true"
            
            login_resp = session.post(login_page.url, data=payload, timeout=15, allow_redirects=False)
            
            if login_resp.status_code not in REDIRECT_STATUS_CODES:
                if "credentialError" in login_resp.text or "无效" in login_resp.text or "错误" in login_resp.text:
                    raise AuthError("用户名或密码错误")
                if "验证码" in login_resp.text:
                    raise AuthError("需要验证码，请稍后重试")
                raise AuthError(f"登录失败，状态码: {login_resp.status_code}")
            
            # 7. 处理 ticket 跳转
            ticket_url = urljoin(login_resp.url, login_resp.headers.get("Location", ""))
            sso_resp = session.get(ticket_url, timeout=15, allow_redirects=False)
            
            self._handle_cookies(session, sso_resp)
            
            if sso_resp.status_code in REDIRECT_STATUS_CODES:
                next_url = urljoin(sso_resp.url, sso_resp.headers.get("Location", ""))
                if next_url:
                    session.get(next_url, timeout=15)
            
            self.session = session
            return session
            
        except AuthError:
            raise
        except requests.RequestException as e:
            raise AuthError(f"网络请求失败: {e}") from e
        except Exception as e:
            raise AuthError(f"登录过程出错: {e}") from e
    
    def _do_portal_login(self, session, page, hidden, username, password):
        """门户登录"""
        payload = {k: v for k, v in hidden.items() if k not in {"username", "password"}}
        payload.update({
            "username": username,
            "password": self._encrypt_password(session, password),
            "_eventId": hidden.get("_eventId", "submit"),
            "execution": hidden["execution"],
        })
        
        resp = session.post(page.url, data=payload, timeout=15, allow_redirects=False)
        
        if resp.status_code in REDIRECT_STATUS_CODES:
            ticket_url = urljoin(resp.url, resp.headers.get("Location", ""))
            if ticket_url:
                ticket_resp = session.get(ticket_url, timeout=15, allow_redirects=False)
                if ticket_resp.status_code in REDIRECT_STATUS_CODES:
                    final_url = urljoin(ticket_resp.url, ticket_resp.headers.get("Location", ""))
                    if final_url:
                        session.get(final_url, timeout=15)
    
    def _handle_cookies(self, session, response):
        """处理 Set-Cookie"""
        try:
            raw_cookies = response.raw.headers.get_all("Set-Cookie") or []
        except AttributeError:
            return
        
        for cookie_str in raw_cookies:
            cookie = SimpleCookie()
            cookie.load(cookie_str)
            for morsel in cookie.values():
                session.cookies.set(
                    morsel.key, morsel.value,
                    domain=morsel["domain"] or "jwxt.xisu.edu.cn",
                    path=morsel["path"] or "/"
                )
