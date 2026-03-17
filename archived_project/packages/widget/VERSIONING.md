# Widget Versioning Guide - AUTOMATED SYSTEM 🚀

## 🎯 Zero-Memory Workflow (Recommended)

The widget now has **full automation**! You literally don't need to remember any commands:

```bash
# Edit widget source files (add features, fix bugs, etc.)
git add .
git commit -m "feat: add form text customization"  # 'feat:' triggers minor version
git push  # ← Everything else happens automatically! ✨
```

### What Happens Automatically:
1. **Pre-push hook detects** widget changes
2. **Analyzes your commit** to determine version bump type
3. **Builds widget** with new version number
4. **Creates all version aliases** (exact, minor, major, latest)
5. **Updates dashboard** to use new version
6. **Commits version bump** automatically
7. **Continues with your push**

## 📊 Version Types (Auto-Detected from Commits)

| Commit Pattern | Version Bump | Example |
|---|---|---|
| `feat:`, `feature:`, `add ` | **Minor** | 1.0.0 → 1.1.0 |
| `fix:`, `bug`, `patch` | **Patch** | 1.0.0 → 1.0.1 |
| `breaking`, `!:` | **Major** | 1.0.0 → 2.0.0 |

## 🎮 Manual Commands (If Needed)

### Version Management:
```bash
npm run version              # Show current version info
npm run version:list         # List all available versions
npm run version:preview      # Preview what next version would be
npm run version:minor        # Manually bump minor version
npm run version:patch        # Manually bump patch version
npm run version:major        # Manually bump major version
```

### Build & Release:
```bash
npm run auto-build           # Smart build + deploy system
npm run release:minor        # Version bump + build + deploy
npm run build                # Just build widget (old way)
```

### Skip Automation:
Add `[skip-build]` to your commit message to bypass automation:
```bash
git commit -m "docs: update README [skip-build]"
```

## CDN URLs
- **Exact**: `https://app.feedbacks.dev/cdn/widget/1.0.0.js` (never changes)
- **Stable**: `https://app.feedbacks.dev/cdn/widget/1.0.js` (auto bug fixes)  
- **Latest**: `https://app.feedbacks.dev/cdn/widget/latest.js` (cutting edge)

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