# Publishing COBOL Offset Analyzer to VSCode Marketplace

This guide walks you through publishing the extension to the official VSCode Marketplace.

## Prerequisites

- Node.js 20.9.0+ (you have this ✓)
- A Microsoft account (free)
- `vsce` (already installed ✓)

## Step-by-Step Instructions

### 1. Create a Publisher Account

1. Go to https://dev.azure.com/
2. Sign in with your Microsoft account (or create one)
3. Create a new Azure DevOps Organization (or use existing)
4. Go to https://marketplace.visualstudio.com/
5. Sign in with the same account
6. Click "Publish extensions" at the bottom

### 2. Create Personal Access Token (PAT)

1. In Azure DevOps, click your **profile icon** (top-right)
2. Select **"Personal access tokens"**
3. Click **"New Token"**
4. Fill in:
   - **Name:** `vscode-ext-publish`
   - **Expiration:** Custom (1 year recommended)
   - **Scopes:** Select only:
     - ☑ Marketplace (Manage)
5. Click **"Create"**
6. **COPY the token** (you won't see it again!)
7. Save it securely (use a password manager)

### 3. Create Your Publisher ID

1. Go to https://marketplace.visualstudio.com/manage
2. Click "Create publisher"
3. Enter your **publisher ID** (e.g., `abraham-villeda`)
   - Must be unique, lowercase, no spaces
   - This is permanent!
4. Click "Create"

### 4. Update package.json

Edit `package.json` and update:

```json
{
  "publisher": "abraham-villeda",  // Your publisher ID from step 3
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-USERNAME/cobol-offset-analyzer"
  }
}
```

### 5. Login to vsce

Run in terminal:

```bash
cd "/Users/villeda/Claudio/COBOL/VsCode Offset"
npx vsce login YOUR-PUBLISHER-ID
```

When prompted, paste the PAT token you created in Step 2.

### 6. Package and Publish

**Option A: Auto-publish (recommended)**
```bash
npm run publish
```

**Option B: Manual two-step**
```bash
# Step 1: Create .vsix package
npm run package

# Step 2: Publish the package
npx vsce publish --packagePath cobol-offset-analyzer-0.0.1.vsix
```

### 7. Verify Publication

1. Go to https://marketplace.visualstudio.com/
2. Search for "cobol-offset-analyzer"
3. Your extension should appear!
4. Test by installing from VSCode:
   - Press `Ctrl+Shift+X` (Extensions)
   - Search "cobol-offset"
   - Click "Install"

## Updating the Extension

When you make changes and want to update:

1. Update version in `package.json`:
   ```json
   "version": "0.0.2"
   ```

2. Commit changes to git (optional but recommended)

3. Publish:
   ```bash
   npm run publish
   ```

## Troubleshooting

### "Missing publisher in package.json"
- Update `package.json` with your publisher ID from Step 3

### "Authentication failed"
- Run `npx vsce logout`
- Run `npx vsce login YOUR-PUBLISHER-ID` again
- Paste the token carefully (no extra spaces)

### "Repository not found in package.json"
- Add `repository` field to `package.json` (see Step 4)

### Token expired
- Generate a new PAT in Azure DevOps (Step 2)
- Login again with `npx vsce login`

## Package Contents

The `.vsix` package includes:
- Compiled JavaScript (`out/`)
- TypeScript source (`src/`)
- Configuration files
- README, LICENSE, etc.

## After Publishing

Users can now:
1. Open VSCode
2. Press `Ctrl+Shift+X` (Extensions)
3. Search "COBOL Offset Analyzer"
4. Click Install
5. Press `Ctrl+Shift+O` on COBOL files to use it!

## Resources

- [VSCode Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Marketplace Terms](https://marketplace.visualstudio.com/about)

---

**Questions?** Check the official VSCode documentation or GitHub issues.
