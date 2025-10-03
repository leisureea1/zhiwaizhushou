#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
环境检查脚本
用于检查运行校园小程序后台管理系统所需的环境是否已正确安装
"""

import sys
import subprocess
import os

def check_python():
    """检查Python版本"""
    print("检查Python...")
    try:
        version = sys.version_info
        if version.major >= 3 and version.minor >= 6:
            print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
            return True
        else:
            print(f"✗ Python版本过低: {version.major}.{version.minor}.{version.micro}")
            return False
    except Exception as e:
        print(f"✗ 未找到Python: {e}")
        return False

def check_php():
    """检查PHP版本"""
    print("\n检查PHP...")
    try:
        result = subprocess.run(['php', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✓ {version_line}")
            return True
        else:
            print(f"✗ PHP执行失败: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("✗ PHP检查超时")
        return False
    except FileNotFoundError:
        print("✗ 未找到PHP")
        return False
    except Exception as e:
        print(f"✗ PHP检查出错: {e}")
        return False


def check_composer():
    """检查Composer"""
    print("\n检查Composer...")
    try:
        # 检查全局Composer
        result = subprocess.run(['composer', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✓ {version_line}")
            return True
    except FileNotFoundError:
        pass
    
    # 检查本地Composer
    if os.path.exists('composer.phar'):
        try:
            result = subprocess.run(['php', 'composer.phar', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                version_line = result.stdout.split('\n')[0]
                print(f"✓ {version_line} (本地)")
                return True
        except FileNotFoundError:
            pass
    
    print("✗ 未找到Composer")
    return False


def check_php_dependencies():
    """检查PHP依赖是否已安装"""
    print("\n检查PHP依赖...")
    if os.path.exists('backend/vendor/autoload.php'):
        print("✓ PHP依赖已安装")
        return True
    else:
        print("✗ PHP依赖未安装，请运行 'composer install' 或 'php composer.phar install'")
        return False

def check_pip_packages():
    """检查Python依赖包"""
    print("\n检查Python依赖...")
    required_packages = ['requests', 'beautifulsoup4']
    
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', 'list'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            installed_packages = [line.split()[0].lower() for line in result.stdout.split('\n') if line]
            missing_packages = []
            
            for package in required_packages:
                if package.lower() not in installed_packages:
                    missing_packages.append(package)
            
            if missing_packages:
                print(f"✗ 缺少依赖包: {', '.join(missing_packages)}")
                print("  请运行: pip install -r python/requirements.txt")
                return False
            else:
                print("✓ 所有Python依赖已安装")
                return True
        else:
            print(f"✗ 无法获取pip包列表: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("✗ pip检查超时")
        return False
    except Exception as e:
        print(f"✗ pip检查出错: {e}")
        return False

def check_project_structure():
    """检查项目结构"""
    print("\n检查项目结构...")
    required_paths = [
        'backend/public/index.php',
        'database/schema.sql',
        'python/crawler/edu_crawler.py',
        'scripts/start.sh'
    ]
    
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    missing_paths = []
    for path in required_paths:
        full_path = os.path.join(base_path, path)
        if not os.path.exists(full_path):
            missing_paths.append(path)
    
    if missing_paths:
        print(f"✗ 缺少文件或目录: {', '.join(missing_paths)}")
        return False
    else:
        print("✓ 项目结构完整")
        return True

def main():
    """主函数"""
    print("校园小程序后台管理系统环境检查")
    print("=" * 40)
    
    checks = [
        check_python,
        check_php,
        check_composer,
        check_php_dependencies,
        check_pip_packages,
        check_project_structure
    ]
    
    results = []
    for check in checks:
        results.append(check())
    
    print("\n" + "=" * 40)
    if all(results):
        print("✓ 所有检查通过，环境已正确设置！")
        return 0
    else:
        print("✗ 部分检查失败，请根据提示修复问题。")
        return 1

if __name__ == "__main__":
    sys.exit(main())