#!/bin/bash

# 校园小程序后台管理系统启动脚本

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    echo "请在项目根目录运行此脚本"
    exit 1
fi

# 检查PHP是否已安装
if ! command -v php &> /dev/null; then
    echo "错误: 未找到PHP，请先安装PHP"
    exit 1
fi

# 检查Composer是否已安装
if [ ! -f "composer.phar" ]; then
    echo "正在下载Composer..."
    curl -sS https://getcomposer.org/installer | php
fi

# 检查PHP依赖是否已安装
if [ ! -f "backend/vendor/autoload.php" ]; then
    echo "正在安装PHP依赖..."
    cd backend
    php ../composer.phar install
    cd ..
fi

# 启动PHP开发服务器
echo "正在启动PHP开发服务器..."
echo "前台页面: http://localhost:8001"
echo "后台管理: http://localhost:8001/admin"
echo "按 Ctrl+C 停止服务器"

cd backend/public
php -S localhost:8001