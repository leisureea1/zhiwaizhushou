# FastAPI 宝塔面板部署指南

## 1. 上传代码

将 `python` 目录上传到：`/www/wwwroot/jwxt-api`

## 2. 安装依赖

```bash
cd /www/wwwroot/jwxt-api
/www/server/python_manager/versions/3.9.10/bin/pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 3. 配置 Supervisor

在宝塔 Supervisor 管理器中添加：

- **名称**: `jwxt-api`
- **启动命令**: `/www/server/python_manager/versions/3.9.10/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
- **运行目录**: `/www/wwwroot/jwxt-api`
- **启动用户**: `root`

## 4. 目录权限

```bash
chmod -R 777 /www/wwwroot/jwxt-api/data
```

## 5. 常用命令

```bash
supervisorctl status jwxt-api
supervisorctl restart jwxt-api
tail -f /www/wwwlogs/jwxt-api.log
```
