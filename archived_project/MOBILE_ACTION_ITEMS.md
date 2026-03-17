# Mobile Support - Action Items & Priority List

## Critical Priority (Do First - Blocking Issues)

### 1. Add `@media (hover: hover)` to hover-based components
**Status**: Blocking mobile usability
**Files**: 
- `/packages/dashboard/src/components/ui/card-hover-effect.tsx`
- `/packages/dashboard/src/components/ui/hover-border-gradient.tsx`
- Any component with hover-only CSS

**Code Pattern**:
```css
/* Before */
.card:hover {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

/* After */
@media (hover: hover) {
  .card:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
}
```

**Estimated Time**: 20 minutes

---

### 2. Fix Feedback Table Horizontal Scroll
**Status**: Currently unviewable on mobile
**File**: `/packages/dashboard/src/app/(dashboard)/feedback/page.tsx`

**Changes Needed**:
```tsx
// Wrap table in scrollable container
<div className="overflow-x-auto">
  <table className="w-full">
    {/* columns with whitespace-nowrap */}
  </table>
</div>
```

**Estimated Time**: 15 minutes

---

### 3. Landing Page Mobile Header Fix
**Status**: Corner controls overlap content
**File**: `/packages/dashboard/src/app/page.tsx`

**Issues**:
- Fixed positioning for GitHub and theme toggle buttons overlaps content
- Need better mobile spacing
- Need to verify safe areas

**Changes**:
- Move buttons into header (not fixed)
- Add responsive padding
- Test on small screens (320px)

**Estimated Time**: 30 minutes

---

## High Priority (Do Next - Major Gaps)

### 4. Add Responsive Text Sizing
**Files**: Multiple pages
**Issue**: Fixed font sizes don't adapt to mobile

**Pattern to Implement**:
```tsx
// Mobile first
<h1 className="text-lg md:text-2xl lg:text-3xl">
  Heading
</h1>

// Or use clamp() for gradual scaling
<h1 style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}>
  Heading
</h1>
```

**Estimated Time**: 45 minutes (audit + implement)

---

### 5. Implement Mobile Test Suite
**Status**: Only 1 e2e test file exists
**File Location**: Create `/packages/dashboard/tests/e2e/mobile.spec.ts`

**Test Coverage Needed**:
- [ ] Dashboard page at 320px, 375px, 768px
- [ ] Projects list on mobile
- [ ] Feedback page scrolling
- [ ] Form submission on mobile
- [ ] Navigation between pages
- [ ] Touch interactions

**Test Template**:
```typescript
test.describe.only('Mobile Viewport Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to 375x667 (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('dashboard page renders correctly on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    // assertions
  });
});
```

**Estimated Time**: 2-3 hours

---

### 6. Settings Page Mobile Layout
**Status**: Form layout needs optimization
**File**: `/packages/dashboard/src/app/(dashboard)/settings/page.tsx`

**Issues**:
- Long label text may overflow
- Form groups could stack better
- Input fields need better spacing

**Pattern**:
```tsx
<div className="flex flex-col gap-6">
  <div className="flex flex-col gap-3">
    <Label>Form Label</Label>
    <Input />
  </div>
  {/* Repeat */}
</div>
```

**Estimated Time**: 30 minutes

---

### 7. Profile Page Mobile Layout
**Status**: Similar to settings
**File**: `/packages/dashboard/src/app/(dashboard)/profile/page.tsx`

**Estimated Time**: 30 minutes

---

## Medium Priority (Do After)

### 8. Image Responsive Classes
**Status**: Unoptimized image sizing
**Affected Files**: All pages with images
- Logo (8px → 8px on all screens)
- User avatars
- Screenshot attachments

**Pattern**:
```tsx
<img 
  src="..." 
  alt="..."
  className="w-full h-auto max-w-full"
/>
```

**Estimated Time**: 45 minutes

---

### 9. Form Field Wrapping
**Status**: Labels may wrap awkwardly
**Files**: Settings, Profile, Auth pages

**Pattern**:
```tsx
<div className="flex flex-col gap-2">
  <Label className="truncate">Label</Label>
  <Input />
</div>
```

**Estimated Time**: 45 minutes

---

### 10. Button Touch Targets
**Status**: Some buttons < 44px
**Task**: Audit and fix

**Pattern**:
```tsx
<Button className="min-h-[44px] min-w-[44px]">
  Action
</Button>
```

**Estimated Time**: 30 minutes

---

## Lower Priority (Nice to Have)

### 11. Modal Positioning Enhancement
**Status**: Good but could be better
**File**: `/packages/widget/src/styles.css`

**Improvements**:
- Better mobile safe area handling
- Better overlay alignment for notched phones

**Estimated Time**: 1 hour

---

### 12. Feedback Table Card View for Mobile
**Status**: Alternative view option
**Concept**: Show as cards on mobile, table on desktop

**Estimated Time**: 2-3 hours

---

### 13. Analytics Chart Responsiveness
**Status**: Charts need mobile optimization
**Files**: Dashboard analytics components

**Estimated Time**: 2 hours

---

### 14. Widget Gesture Support
**Status**: Optional enhancement
**Features**: Swipe to close, drag to move

**Estimated Time**: 3-4 hours

---

## Total Effort Estimate

| Priority | Items | Time |
|----------|-------|------|
| Critical | 3 | 1 hour 5 min |
| High | 4 | 3.5 hours |
| Medium | 3 | 2 hours |
| Lower | 4 | 8-9 hours |
| **Total** | **14** | **14.5-16 hours** |

---

## Recommended Sprint Plan

### Week 1: Critical Fixes (5 hours)
- [ ] Add hover media query (20 min)
- [ ] Fix feedback table scroll (15 min)
- [ ] Fix landing page header (30 min)
- [ ] Add responsive text sizing (45 min)
- [ ] Implement mobile test suite (2.5 hours)

### Week 2: Layout Optimization (3 hours)
- [ ] Settings page mobile (30 min)
- [ ] Profile page mobile (30 min)
- [ ] Image responsive classes (45 min)
- [ ] Form field wrapping (45 min)
- [ ] Button touch targets (30 min)

### Week 3: Polish & Testing (2-3 hours)
- [ ] Modal positioning (1 hour)
- [ ] Manual testing on real devices
- [ ] Fix any issues found

### Optional Future Work
- [ ] Feedback table card view
- [ ] Analytics chart responsiveness
- [ ] Widget gesture support

---

## Files Organized by Modification Priority

### Priority 1 (Modify First)
1. `/packages/dashboard/src/components/ui/card-hover-effect.tsx`
2. `/packages/dashboard/src/components/ui/hover-border-gradient.tsx`
3. `/packages/dashboard/src/app/(dashboard)/feedback/page.tsx`
4. `/packages/dashboard/src/app/page.tsx`

### Priority 2 (Modify Next)
5. `/packages/dashboard/src/app/(dashboard)/settings/page.tsx`
6. `/packages/dashboard/src/app/(dashboard)/profile/page.tsx`
7. All image components/pages
8. All form field components

### Priority 3 (Modify Later)
9. `/packages/widget/src/styles.css`
10. `/packages/dashboard/src/components/project-analytics.tsx`
11. `/packages/dashboard/src/components/overview-analytics.tsx`

---

## Testing Checkpoints

After completing each section, test at these viewports:
- 320px (iPhone SE)
- 375px (iPhone 14)
- 768px (iPad)
- 1024px (Desktop)

Use browser DevTools or Playwright to test responsiveness.

---

## Verification Checklist

After implementing changes:

- [ ] All buttons are at least 44x44px (44x44 minimum)
- [ ] Text doesn't overflow on 320px screens
- [ ] Forms stack properly on mobile
- [ ] Tables are horizontally scrollable (or card view)
- [ ] Images scale responsively
- [ ] Hover effects only trigger on hover-capable devices
- [ ] All pages tested at 3 viewport sizes minimum
- [ ] Touch interactions work without lag
- [ ] Navigation is accessible on mobile
- [ ] Safe areas respected (iOS notch, Android nav bar)

---

## Quick Reference: Common Mobile Patterns

### Responsive Spacing
```tsx
// Spacing that adapts to screen size
<div className="p-3 sm:p-4 md:p-6 lg:p-8">
  Content
</div>
```

### Responsive Grid
```tsx
// 1 column on mobile, 2 on tablet, 3+ on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Responsive Text
```tsx
<h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl">
  Heading
</h1>
```

### Responsive Flex Direction
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <Item />
  <Item />
</div>
```

### Hidden/Shown at Breakpoints
```tsx
{/* Hidden on mobile, shown on tablet+ */}
<div className="hidden md:block">Desktop content</div>

{/* Shown on mobile, hidden on tablet+ */}
<div className="md:hidden">Mobile content</div>
```

---

## Resources

- Tailwind Responsive Design: https://tailwindcss.com/docs/responsive-design
- CSS Media Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries
- Safe Area Support: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- Touch Targets: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- Playwright Mobile Testing: https://playwright.dev/docs/mobile

---

## Questions to Answer Before Starting

1. What's the primary device type for users?
2. Should we prioritize iOS or Android?
3. Do users work mobile-only or desktop-primarily?
4. What's the minimum screen width to support? (320px vs 375px)
5. What accessibility standards are we targeting? (WCAG 2.1 AA?)

