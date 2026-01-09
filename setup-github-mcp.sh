#!/bin/bash

# GitHub MCP 配置脚本
# 此脚本将添加 GitHub MCP 服务器配置到 Cursor 的 MCP 配置文件

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

# 检查是否已经配置了 github MCP
if grep -q '"github"' "$CURSOR_MCP_CONFIG"; then
    echo "警告: 配置文件中已存在 'github' MCP 服务器配置"
    read -p "是否要更新配置? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消操作"
        exit 0
    fi
fi

# 提示用户输入 Personal Access Token
echo ""
echo "========================================="
echo "GitHub MCP 配置"
echo "========================================="
echo ""
echo "请获取您的 GitHub Personal Access Token (PAT):"
echo "1. 访问 https://github.com/settings/tokens"
echo "2. 点击 'Generate new token' -> 'Generate new token (classic)'"
echo "3. 设置 Token 名称和过期时间"
echo "4. 选择所需的权限范围（Scopes）:"
echo "   - repo (完整仓库访问)"
echo "   - read:org (读取组织信息)"
echo "   - read:user (读取用户信息)"
echo "   - workflow (GitHub Actions)"
echo "   根据您的需求选择适当的权限"
echo "5. 点击 'Generate token' 生成令牌"
echo "   ⚠️  重要: Token 只会显示一次，请妥善保存"
echo ""
read -p "请输入您的 GitHub Personal Access Token (留空将使用占位符): " GITHUB_PAT

if [ -z "$GITHUB_PAT" ]; then
    GITHUB_PAT="YOUR_GITHUB_PAT_HERE"
    echo "使用占位符，请稍后手动更新配置文件"
fi

# 使用 Python 或 Node.js 来更新 JSON 文件
if command -v python3 &> /dev/null; then
    python3 << EOF
import json
import sys

config_file = "$CURSOR_MCP_CONFIG"
github_pat = "$GITHUB_PAT"

try:
    # 读取现有配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # 确保 mcpServers 存在
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    # 添加或更新 github 配置
    config['mcpServers']['github'] = {
        "command": "npx",
        "args": [
            "-y",
            "@modelcontextprotocol/server-github"
        ],
        "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": github_pat
        }
    }
    
    # 写回文件
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✓ 已成功添加 GitHub MCP 配置")
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
        if [ "$GITHUB_PAT" = "YOUR_GITHUB_PAT_HERE" ]; then
            echo ""
            echo "⚠️  重要: 请手动编辑配置文件并替换 YOUR_GITHUB_PAT_HERE 为您的实际 Personal Access Token"
        fi
        echo ""
        echo "请重启 Cursor IDE 以使配置生效。"
        echo ""
        echo "GitHub MCP 功能："
        echo "- 获取仓库信息"
        echo "- 执行 Git 相关操作"
        echo "- 管理 Issues 和 Pull Requests"
        echo "- 查看和管理 GitHub Actions"
    else
        echo "配置失败，请检查错误信息"
        exit 1
    fi
else
    echo "错误: 需要 Python 3 来更新 JSON 配置文件"
    echo "请手动添加以下配置到 $CURSOR_MCP_CONFIG 的 mcpServers 对象中："
    echo ""
    echo '  "github": {'
    echo '    "command": "npx",'
    echo '    "args": ['
    echo '      "-y",'
    echo '      "@modelcontextprotocol/server-github"'
    echo '    ],'
    echo '    "env": {'
    echo "      \"GITHUB_PERSONAL_ACCESS_TOKEN\": \"$GITHUB_PAT\""
    echo '    }'
    echo '  }'
    exit 1
fi
