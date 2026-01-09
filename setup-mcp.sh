#!/bin/bash

# MCP Filesystem 配置脚本
# 此脚本将自动创建 Cursor 的 MCP 配置文件

# 获取当前脚本所在目录（项目根目录）
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cursor MCP 配置文件路径
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

# 如果 .cursor 目录不存在，创建它
mkdir -p "$HOME/.cursor"

# 检查配置文件是否已存在
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    echo "检测到现有的 MCP 配置文件: $CURSOR_MCP_CONFIG"
    echo "正在备份现有配置文件..."
    cp "$CURSOR_MCP_CONFIG" "$CURSOR_MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 检查是否已经配置了 filesystem MCP
    if grep -q '"filesystem"' "$CURSOR_MCP_CONFIG"; then
        echo "警告: 配置文件中已存在 'filesystem' MCP 服务器配置"
        echo "您需要手动合并配置，或使用备份文件恢复"
        echo ""
        echo "新的配置内容应该类似："
        echo "  \"filesystem\": {"
        echo "    \"command\": \"npx\","
        echo "    \"args\": [\"-y\", \"@modelcontextprotocol/server-filesystem\", \"$PROJECT_DIR\"],"
        echo "    \"env\": {}"
        echo "  }"
        exit 1
    fi
fi

# 创建新的配置文件内容
CONFIG_CONTENT=$(cat <<EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "$PROJECT_DIR"
      ],
      "env": {}
    }
  }
}
EOF
)

# 如果配置文件不存在，创建新文件
if [ ! -f "$CURSOR_MCP_CONFIG" ]; then
    echo "$CONFIG_CONTENT" > "$CURSOR_MCP_CONFIG"
    echo "✓ 已创建 MCP 配置文件: $CURSOR_MCP_CONFIG"
else
    echo "配置文件已存在，请手动添加以下配置到 'mcpServers' 对象中："
    echo ""
    echo "$CONFIG_CONTENT"
    echo ""
    echo "或者，您可以："
    echo "1. 查看备份文件: $CURSOR_MCP_CONFIG.backup.*"
    echo "2. 手动编辑配置文件: $CURSOR_MCP_CONFIG"
fi

echo ""
echo "配置完成！"
echo "请重启 Cursor IDE 以使配置生效。"
echo ""
echo "项目路径: $PROJECT_DIR"
echo "配置文件: $CURSOR_MCP_CONFIG"
