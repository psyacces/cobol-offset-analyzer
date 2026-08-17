#!/bin/bash

# COBOL Offset Analyzer - Publisher Script

echo "=========================================="
echo "COBOL Offset Analyzer - VSCode Marketplace"
echo "=========================================="
echo ""

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo "Installing vsce..."
    npm install -g @vscode/vsce
fi

echo ""
echo "Step 1: Ensure package.json is configured"
echo "Edit package.json and set your publisher ID:"
echo "  \"publisher\": \"your-publisher-id\""
echo ""
read -p "Press ENTER once you've updated package.json..."

echo ""
echo "Step 2: Compile TypeScript"
npm run compile

echo ""
echo "Step 3: Package extension"
vsce package

echo ""
echo "Step 4: Login to VSCode Marketplace"
echo "You'll need your Personal Access Token (PAT)"
echo "Get it from: https://dev.azure.com/YOUR-ORG/_usersSettings/tokens"
echo ""
read -p "Enter your publisher ID: " PUBLISHER_ID
read -p "Enter your PAT token: " PAT_TOKEN

echo ""
echo "Logging in..."
echo "$PAT_TOKEN" | vsce login "$PUBLISHER_ID"

echo ""
echo "Step 5: Publishing extension..."
vsce publish

echo ""
echo "=========================================="
echo "✅ Done! Your extension is published!"
echo "=========================================="
echo ""
echo "Visit: https://marketplace.visualstudio.com"
echo "Search for: cobol-offset-analyzer"
