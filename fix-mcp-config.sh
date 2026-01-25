#!/bin/bash

# MCP 配置修复脚本
# 此脚本用于修复 Cursor MCP 服务器配置问题

echo "🔧 MCP 配置修复工具"
echo "===================="
echo ""

# Cursor MCP 配置文件路径
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"
PROJECT_CONFIG="./mcp-config.json"

# 检查项目配置文件是否存在
if [ ! -f "$PROJECT_CONFIG" ]; then
    echo "❌ 错误: 项目配置文件不存在: $PROJECT_CONFIG"
    exit 1
fi

# 检查 Cursor 配置目录是否存在
if [ ! -d "$HOME/.cursor" ]; then
    echo "📁 创建 .cursor 目录..."
    mkdir -p "$HOME/.cursor"
fi

# 备份现有配置
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    BACKUP_FILE="$CURSOR_MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 备份现有配置到: $BACKUP_FILE"
    cp "$CURSOR_MCP_CONFIG" "$BACKUP_FILE"
fi

# 复制项目配置到 Cursor 配置
echo "📋 复制项目配置到 Cursor 配置文件..."
cp "$PROJECT_CONFIG" "$CURSOR_MCP_CONFIG"

# 验证 JSON 格式
echo "✅ 验证 JSON 格式..."
if python3 -m json.tool "$CURSOR_MCP_CONFIG" > /dev/null 2>&1; then
    echo "✓ JSON 格式正确"
else
    echo "❌ JSON 格式错误，请检查配置文件"
    exit 1
fi

# 显示配置摘要
echo ""
echo "📊 配置摘要:"
echo "============"
cat "$CURSOR_MCP_CONFIG" | python3 -c "
import json, sys
data = json.load(sys.stdin)
servers = data.get('mcpServers', {})
print(f'已配置的 MCP 服务器数量: {len(servers)}')
for name in servers.keys():
    print(f'  - {name}')
"

echo ""
echo "✅ 配置已更新！"
echo ""
echo "📝 下一步操作:"
echo "1. 重启 Cursor IDE（完全退出并重新打开）"
echo "2. 等待 Cursor 加载 MCP 服务器（可能需要几秒钟）"
echo "3. 在 Cursor 中运行 /mcp 命令验证配置"
echo ""
echo "🔍 如果问题仍然存在，请检查:"
echo "  - Cursor 版本是否支持 MCP（需要最新版本）"
echo "  - Node.js 是否已安装（运行: node --version）"
echo "  - 网络连接是否正常（MCP 服务器需要下载依赖）"
echo ""
echo "配置文件位置: $CURSOR_MCP_CONFIG"
