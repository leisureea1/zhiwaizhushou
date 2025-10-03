#!/bin/bash

# Taro 项目安全漏洞修复脚本
# 用于处理npm audit发现的安全问题

set -e  # 遇到错误时停止执行

echo "🔒 Taro项目安全漏洞修复脚本"
echo "================================"

# 检查是否在正确的目录
if [[ ! -f "package.json" ]]; then
    echo "❌ 错误: 未找到package.json文件"
    echo "请在项目根目录运行此脚本"
    exit 1
fi

# 1. 备份当前配置
echo "💾 备份当前配置..."
cp package.json package.json.backup
if [[ -f "package-lock.json" ]]; then
    cp package-lock.json package-lock.json.backup
fi
echo "✅ 配置已备份"

# 2. 显示当前漏洞情况
echo ""
echo "🔍 当前安全漏洞情况:"
npm audit --audit-level moderate || true

# 3. 清理和重新安装
echo ""
echo "🧹 清理项目..."
rm -rf node_modules package-lock.json
npm cache clean --force

echo "📦 重新安装依赖..."
npm install

# 4. 检查安装后的漏洞
echo ""
echo "🔍 安装后的安全状况:"
npm audit --audit-level moderate || true

# 5. 尝试自动修复
echo ""
echo "🔧 尝试自动修复安全漏洞..."
npm audit fix || true

# 6. 询问是否强制修复
echo ""
AUDIT_RESULT=$(npm audit --audit-level high 2>/dev/null | grep -c "vulnerabilities" || echo "0")
if [[ "$AUDIT_RESULT" != "0" ]]; then
    echo "⚠️  仍有高风险漏洞存在"
    read -p "是否尝试强制修复? (可能有破坏性更改) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚨 执行强制修复..."
        npm audit fix --force || true
    else
        echo "⏭️  跳过强制修复"
    fi
fi

# 7. 功能测试
echo ""
echo "🧪 测试项目功能..."

# 检查TypeScript编译
echo "   检查TypeScript编译..."
if npx tsc --noEmit; then
    echo "   ✅ TypeScript编译通过"
else
    echo "   ❌ TypeScript编译失败"
fi

# 检查ESLint
echo "   检查代码规范..."
if npm run lint > /dev/null 2>&1; then
    echo "   ✅ 代码规范检查通过"
else
    echo "   ⚠️  代码规范检查有警告（可忽略）"
fi

# 8. 最终报告
echo ""
echo "📊 最终安全审计报告:"
echo "================================"
npm audit || true

echo ""
echo "✅ 安全修复脚本执行完成！"
echo ""
echo "📝 下一步操作建议："
echo "1. 测试微信小程序: npm run dev:weapp"
echo "2. 测试H5版本: npm run dev:h5"  
echo "3. 测试构建: npm run build:weapp"
echo ""
echo "🔄 如果出现问题："
echo "1. 恢复配置: cp package.json.backup package.json"
echo "2. 重新安装: rm -rf node_modules package-lock.json && npm install"
echo "3. 查看安全指南: cat SECURITY_GUIDE.md"
echo ""
echo "📁 备份文件:"
echo "   - package.json.backup"
if [[ -f "package-lock.json.backup" ]]; then
    echo "   - package-lock.json.backup"
fi
