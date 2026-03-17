# Mobile App Support - Coming Soon Feature

**Date**: October 19, 2025
**Status**: ✅ Implemented
**Type**: UI Enhancement

---

## 🎯 What Was Added

Added **"Coming Soon"** badges for **Android** and **iOS** mobile app platforms in the widget installation customization page.

---

## 📸 What It Looks Like

### Platform Selection (Step 1):

The platform selection now shows:

```
[Website]  [React]  [Vue]  [WordPress Beta]  [Shopify Beta]  [Android Coming Soon]  [iOS Coming Soon]
```

- **Android** and **iOS** buttons are **disabled** (greyed out)
- Both have a **"Coming Soon"** badge next to them
- Users can see them but cannot select them yet

---

## 🔧 Technical Changes

### File Modified:
`packages/dashboard/src/components/widget-installation/widget-installation.tsx`

### Changes Made:

1. **Added New Platform Options** (Line ~94-102):
   ```typescript
   const FRAMEWORK_OPTIONS: Array<{
     value: (typeof SNIPPET_PLATFORMS)[number] | 'android' | 'ios';
     label: string;
     status: 'ready' | 'beta' | 'coming-soon'
   }> = [
     { value: 'website', label: 'Website', status: 'ready' },
     { value: 'react', label: 'React', status: 'ready' },
     { value: 'vue', label: 'Vue', status: 'ready' },
     { value: 'wordpress', label: 'WordPress', status: 'beta' },
     { value: 'shopify', label: 'Shopify', status: 'beta' },
     { value: 'android', label: 'Android', status: 'coming-soon' }, // NEW
     { value: 'ios', label: 'iOS', status: 'coming-soon' },         // NEW
   ];
   ```

2. **Updated Button Rendering** (Line ~1320-1344):
   - Added `disabled={option.status === 'coming-soon'}` to disable buttons
   - Added "Coming Soon" badge rendering:
     ```typescript
     {option.status === 'coming-soon' && (
       <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
         Coming Soon
       </Badge>
     )}
     ```
   - Prevented click events on coming-soon options

3. **Updated Description Text** (Line ~1345):
   - Changed from: `"Website, React, and Vue are production-ready."`
   - To: `"Website, React, and Vue are production-ready. Mobile app support coming soon!"`

4. **Filtered Publish Tab** (Line ~1749-1763):
   - Added `.filter(opt => opt.status !== 'coming-soon')` to exclude Android/iOS from code snippet tabs
   - Users won't see code snippets for platforms that aren't ready yet

---

## ✅ Benefits

### For Users:
- 📱 **See the roadmap** - Users know mobile support is planned
- 🎯 **Set expectations** - Clear "Coming Soon" tells them it's not available yet
- 💡 **Reduces support questions** - Prevents "Where's mobile support?" emails
- 🚀 **Creates anticipation** - Builds excitement for future features

### For You:
- 📊 **Gauge interest** - See how many users click disabled buttons (analytics opportunity)
- 🗺️ **Public roadmap** - Transparent about what's coming
- ⏰ **Buys time** - Shows you're thinking about mobile without committing to timeline
- 🎨 **Professional look** - Shows you have a complete platform vision

---

## 🎨 UI Details

### Button States:

**Ready Platforms** (Website, React, Vue):
- ✅ Fully clickable
- ✅ Show selected state when chosen
- ✅ Generate code snippets in Publish step

**Beta Platforms** (WordPress, Shopify):
- ✅ Fully clickable
- ⚠️ Show "Beta" badge
- ✅ Generate code snippets in Publish step

**Coming Soon Platforms** (Android, iOS):
- 🚫 Disabled (greyed out)
- 🏷️ Show "Coming Soon" badge
- 🚫 NOT shown in Publish step tabs
- 🚫 Cannot be selected

---

## 🔄 Future Work

When you're ready to actually implement mobile support:

### Phase 1: Documentation (No code)
1. Change status from `'coming-soon'` to `'beta'`
2. Add to `SNIPPET_PLATFORMS` type
3. Add to `SNIPPET_LANGUAGES` mapping
4. Write API documentation snippets

### Phase 2: SDK (If you build it)
1. Build React Native SDK
2. Publish to npm
3. Add installation code snippets
4. Change status from `'beta'` to `'ready'`

### Easy Toggle:
To enable Android/iOS when ready, just change ONE line:
```typescript
// From:
{ value: 'android', label: 'Android', status: 'coming-soon' },

// To:
{ value: 'android', label: 'Android', status: 'beta' },
```

---

## 🧪 Testing

### What to Test:
1. ✅ Open widget installation page
2. ✅ Click "Platform" step
3. ✅ Verify Android and iOS buttons are visible
4. ✅ Verify they have "Coming Soon" badges
5. ✅ Verify they are greyed out (disabled)
6. ✅ Try clicking them - nothing should happen
7. ✅ Go to Publish step
8. ✅ Verify Android/iOS don't appear in tabs

### Browser Compatibility:
- ✅ Chrome
- ✅ Safari
- ✅ Firefox
- ✅ Mobile browsers (responsive)

---

## 📊 Analytics Opportunity (Optional)

Consider tracking when users click on disabled mobile buttons:

```typescript
onClick={() => {
  if (option.status === 'coming-soon') {
    // Track interest
    analytics.track('mobile_platform_interest', {
      platform: option.value,
      userId: user?.id,
    });
    // Maybe show a modal: "Want early access? Join the waitlist!"
  } else {
    setSelectedPlatform(option.value);
  }
}}
```

This helps you:
- 📈 Measure demand for mobile support
- 📧 Build an email list for launch announcement
- 🎯 Prioritize iOS vs Android based on interest

---

## 🎯 Marketing Opportunities

### On Your Website:
Add a note in your features page:
> "✨ Coming Soon: Native iOS & Android SDK for in-app feedback collection"

### On Social Media:
Tweet/post:
> "Excited to announce: Mobile app support is coming to feedbacks.dev! 📱
> Soon you'll be able to collect feedback from your iOS & Android apps just as easily as websites.
> Want early access? Drop a 👋 below!"

### In Your Dashboard:
When users hover over the disabled buttons, you could show a tooltip:
> "Mobile SDKs launching Q1 2026! We'll notify you when they're ready."

---

## 💡 User Psychology

**Why showing "Coming Soon" is smart:**

1. **Creates FOMO** (Fear of Missing Out)
   - Users see it's almost there
   - Might wait for it instead of switching to competitors

2. **Transparent Roadmap**
   - Shows you're actively developing
   - Builds trust through honesty

3. **Reduces Churn**
   - Users with mobile apps know support is coming
   - Won't leave because "they don't support mobile"

4. **Free Marketing**
   - People talk about upcoming features
   - "Did you see feedbacks.dev is adding mobile support?"

---

## 🚀 Launch Checklist (When Actually Implementing)

### Before Launch:
- [ ] Write API documentation for mobile
- [ ] Create example apps (iOS/Android/React Native)
- [ ] Test on real devices
- [ ] Prepare launch blog post
- [ ] Update pricing (if mobile affects pricing)

### During Launch:
- [ ] Change status from 'coming-soon' to 'beta'
- [ ] Add code snippets to widget installation
- [ ] Send email to users who showed interest
- [ ] Post on social media
- [ ] Update website homepage

### After Launch:
- [ ] Monitor adoption rate
- [ ] Collect feedback on SDK
- [ ] Fix bugs quickly
- [ ] Iterate based on user feedback

---

## 📝 Notes

- **No Breaking Changes**: This is purely additive UI enhancement
- **Zero Backend Changes**: API already works for mobile (just needs docs)
- **Easy to Remove**: If you change your mind, just remove the two lines
- **Responsive**: Works on mobile browsers (the buttons responsive sizing already)

---

## ✅ Summary

**What was done:**
- Added Android and iOS options to platform selection
- Made them disabled with "Coming Soon" badges
- Updated helper text to mention mobile support
- Filtered them out of code snippet generation

**Impact:**
- Users see your product roadmap
- Sets clear expectations
- Professional appearance
- No actual functionality changes needed yet

**Next step:**
When ready to implement mobile support, just change `'coming-soon'` to `'beta'` and add the code snippets!

---

**That's it! Your platform now shows mobile app support is coming without requiring any actual mobile development yet.** 🎉
