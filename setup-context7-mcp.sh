#!/bin/bash

# Context7 MCP 配置脚本
# 此脚本将添加 Context7 MCP 服务器配置到 Cursor 的 MCP 配置文件

# 获取当前脚本所在目录（项目根目录）
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cursor MCP 配置文件路径
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

# 检查配置文件是否存在
if [ ! -f "$CURSOR_MCP_CONFIG" ]; then
    echo "错误: MCP 配置文件不存在: $CURSOR_MCP_CONFIG"
    echo "请先运行 setup-mcp.sh 创建基础配置文件"
    exit 1
fi

# 备份现有配置文件
echo "正在备份现有配置文件..."
cp "$CURSOR_MCP_CONFIG" "$CURSOR_MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# 检查是否已经配置了 context7 MCP
if grep -q '"context7"' "$CURSOR_MCP_CONFIG"; then
    echo "警告: 配置文件中已存在 'context7' MCP 服务器配置"
    read -p "是否要更新配置? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消操作"
        exit 0
    fi
fi

# 提示用户输入 API Key
echo ""
echo "========================================="
echo "Context7 MCP 配置"
echo "========================================="
echo ""
echo "请获取您的 Context7 API Key:"
echo "1. 访问 https://context7.com/dashboard"
echo "2. 注册或登录账户"
echo "3. 在仪表板中生成新的 API 密钥"
echo "   注意：API 密钥只会显示一次，请妥善保存"
echo ""
read -p "请输入您的 Context7 API Key (留空将使用占位符): " CONTEXT7_API_KEY

if [ -z "$CONTEXT7_API_KEY" ]; then
    CONTEXT7_API_KEY="YOUR_CONTEXT7_API_KEY_HERE"
    echo "使用占位符，请稍后手动更新配置文件"
fi

# 使用 Python 或 Node.js 来更新 JSON 文件
if command -v python3 &> /dev/null; then
    python3 << EOF
import json
import sys

config_file = "$CURSOR_MCP_CONFIG"
api_key = "$CONTEXT7_API_KEY"

try:
    # 读取现有配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # 确保 mcpServers 存在
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    # 添加或更新 context7 配置
    config['mcpServers']['context7'] = {
        "command": "npx",
        "args": [
            "-y",
            "@upstash/context7-mcp",
            "--api-key",
            api_key
        ],
        "env": {}
    }
    
    # 写回文件
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✓ 已成功添加 Context7 MCP 配置")
    sys.exit(0)
    
except json.JSONDecodeError as e:
    print(f"错误: JSON 格式错误: {e}")
    sys.exit(1)
except Exception as e:
    print(f"错误: {e}")
    sys.exit(1)
EOF

    if [ $? -eq 0 ]; then
        echo ""
        echo "配置完成！"
        echo "配置文件: $CURSOR_MCP_CONFIG"
        if [ "$CONTEXT7_API_KEY" = "YOUR_CONTEXT7_API_KEY_HERE" ]; then
            echo ""
            echo "⚠️  重要: 请手动编辑配置文件并替换 YOUR_CONTEXT7_API_KEY_HERE 为您的实际 API Key"
        fi
        echo ""
        echo "请重启 Cursor IDE 以使配置生效。"
        echo ""
        echo "使用提示：在编写提示时，添加 'use context7' 指令来使用 Context7。"
    else
        echo "配置失败，请检查错误信息"
        exit 1
    fi
else
    echo "错误: 需要 Python 3 来更新 JSON 配置文件"
    echo "请手动添加以下配置到 $CURSOR_MCP_CONFIG 的 mcpServers 对象中："
    echo ""
    echo '  "context7": {'
    echo '    "command": "npx",'
    echo '    "args": ['
    echo '      "-y",'
    echo '      "@upstash/context7-mcp",'
    echo '      "--api-key",'
    echo "      \"$CONTEXT7_API_KEY\""
    echo '    ],'
    echo '    "env": {}'
    echo '  }'
    exit 1
fi
