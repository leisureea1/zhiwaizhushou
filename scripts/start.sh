#!/bin/bash

# 校园小程序后台管理系统启动脚本

# 设置项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 设置日志文件
LOG_FILE="/var/log/campus_app.log"

# 创建日志目录（如果不存在）
mkdir -p "$(dirname "$LOG_FILE")"

# 检查是否已经安装了必要的依赖
check_dependencies() {
    echo "检查必要依赖..."
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        echo "错误: 未找到 Python3"
        exit 1
    fi
    
    # 检查PHP
    if ! command -v php &> /dev/null; then
        echo "错误: 未找到 PHP"
        exit 1
    fi
    
    # 检查MySQL客户端
    if ! command -v mysql &> /dev/null; then
        echo "警告: 未找到 MySQL 客户端"
    fi
    
    echo "依赖检查完成"
}

# 启动PHP开发服务器
start_php_server() {
    echo "启动PHP开发服务器..."
    
    # 切换到后端公共目录
    cd "$PROJECT_ROOT/backend/public" || exit 1
    
    # 启动PHP内置服务器
    php -S localhost:8000 >> "$LOG_FILE" 2>&1 &
    PHP_SERVER_PID=$!
    
    echo "PHP服务器已在端口8000启动，PID: $PHP_SERVER_PID"
}

# 启动定时任务
setup_cron_jobs() {
    echo "设置定时任务..."
    
    # 添加定时任务来更新课程数据（每天凌晨2点）
    CRON_JOB="0 2 * * * $PROJECT_ROOT/scripts/update_courses.py >> /var/log/update_courses_cron.log 2>&1"
    
    # 检查是否已存在相同的定时任务
    if crontab -l 2>/dev/null | grep -F "$PROJECT_ROOT/scripts/update_courses.py"; then
        echo "定时任务已存在"
    else
        # 添加新任务
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        echo "定时任务已添加"
    fi
}

# 显示使用说明
show_usage() {
    echo "校园小程序后台管理系统启动脚本"
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  status    查看服务状态"
    echo "  help      显示此帮助信息"
}

# 主函数
main() {
    case "$1" in
        start)
            check_dependencies
            start_php_server
            setup_cron_jobs
            echo "所有服务已启动"
            ;;
        stop)
            echo "停止服务..."
            # 停止PHP服务器
            pkill -f "php -S localhost:8000" 2>/dev/null
            echo "服务已停止"
            ;;
        status)
            echo "检查服务状态..."
            # 检查PHP服务器状态
            if pgrep -f "php -S localhost:8000" > /dev/null; then
                echo "PHP服务器: 运行中"
            else
                echo "PHP服务器: 未运行"
            fi
            ;;
        help|"")
            show_usage
            ;;
        *)
            echo "未知选项: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"