# Widget Versioning Guide

## Version Format
We use **semantic versioning** with clean, simple version numbers:
- `widget-1.0.js` - Major version 1, minor version 0
- `widget-1.1.js` - New features (backward compatible)  
- `widget-2.0.js` - Breaking changes

## Release Process

### 1. Minor Release (New Features)
```bash
npm run version:minor  # 1.0 → 1.1
npm run build
git commit -m "Release widget v1.1"
git push origin main
```

### 2. Major Release (Breaking Changes)
```bash
npm run version:major  # 1.0 → 2.0
npm run build
git commit -m "Release widget v2.0"
git push origin main
```

### 3. What Happens Automatically
- ✅ Updates `package.json` version
- ✅ Updates dashboard template to use new version
- ✅ Builds new `widget-X.X.js` and `widget-X.X.css` files
- ✅ Updates CDN documentation

### 4. Manual Steps
- Update changelog/release notes
- Test the new version
- Commit and push to trigger CDN update

## CDN URLs
- **Latest**: `https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-1.0.js`
- **Specific version**: Pin to exact version for production use
- **Auto-updating**: Use `@main` branch for development

## Backward Compatibility
- Old versions remain available forever
- Users can pin to specific versions
- Dashboard always shows the latest version to new users

## Cache Busting
✅ **Solved!** Each version gets a unique filename, so no CDN cache issues.

## File Structure
```
dist/
  widget-1.0.js     ← Current version
  widget-1.0.css    ← Current styles  
  widget-1.1.js     ← Next version (future)
  widget-1.1.css    ← Next styles (future)
  demo.html         ← Always uses latest
  widget.d.ts       ← TypeScript definitions
  types.d.ts        ← Type definitions
```