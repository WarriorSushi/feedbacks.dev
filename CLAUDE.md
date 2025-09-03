# feedbacks.dev - Instructions for Claude Code CLI

## Primary Development Instructions

**FOLLOW THE GUIDE**: Use `guide.md` as your primary reference for building this project. Only deviate from the guide if you discover errors, security issues, or significant improvements. When deviating, explain why and document the changes.

**READ THE PRD**: Reference `prd.md` for product context, user stories, and business requirements. This helps you understand the "why" behind technical decisions.

## Project Overview

You are building feedbacks.dev - a lightweight feedback widget system with:
- **Widget**: Vanilla TypeScript (<20KB) that embeds anywhere
- **Dashboard**: Next.js 14 + shadcn/ui for feedback management  
- **API**: Secure Supabase backend with proper RLS

## Core Development Rules

### 1. Security First
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to browser code
- Always use service role key ONLY in `/api/feedback/route.ts`
- Validate all inputs server-side (email regex, URL validation, message length)
- Implement rate limiting (10 requests/minute per IP)
- Follow RLS policies strictly

### 2. Mobile-First Design
- Every interface must work perfectly on mobile devices
- Use shadcn/ui components for consistent, accessible design
- Test responsive behavior at 320px, 768px, 1024px, and 1920px
- Implement proper touch targets (minimum 44px)
- Handle iOS safe areas and Android navigation

### 3. Performance Requirements
- Widget bundle: <20KB gzipped
- Widget load time: <100ms globally
- API response: <200ms p95
- Dashboard initial load: <1s
- Use pagination for datasets >20 items

### 4. Code Quality Standards
- TypeScript strict mode, no `any` types
- Functional React components with hooks only
- ES modules (import/export) syntax
- Mobile-first CSS with Tailwind utilities
- Proper error handling and loading states

## Essential Commands

```bash
# Development workflow
npm run dev                 # Start both widget and dashboard
npm run build              # Build for production
npm run type-check         # TypeScript validation

# Widget-specific
npm run widget:dev         # Widget dev server (port 3001)
npm run widget:build       # Build widget for CDN

# Dashboard-specific  
npm run dashboard:dev      # Dashboard dev server (port 3000)
npm run dashboard:build    # Build dashboard

# Testing
npm run test               # Run all tests
npm run test:e2e          # Run Playwright tests
npm run test:widget       # Test widget integration
```

## Testing with Playwright

### Setup Playwright
```bash
# From packages/dashboard directory
npm install -D @playwright/test
npx playwright install
```

### Test Structure
Create tests in `packages/dashboard/tests/`:
```
tests/
├── auth.spec.ts           # Authentication flows
├── dashboard.spec.ts      # Main dashboard functionality
├── projects.spec.ts       # Project CRUD operations
├── feedback.spec.ts       # Feedback management
├── widget-integration.spec.ts # Widget integration testing
└── mobile.spec.ts         # Mobile-specific tests
```

### Critical Test Scenarios
1. **Authentication Flow**: Email magic link and GitHub OAuth
2. **Project Management**: Create, view, update projects
3. **Feedback Submission**: Widget to dashboard flow
4. **Mobile Responsiveness**: All breakpoints
5. **Widget Integration**: Cross-origin functionality
6. **Real User Scenarios**: Complete user journeys

### Playwright Test Commands
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Mobile testing
npx playwright test --project=Mobile

# Generate test report
npx playwright show-report
```

## Workflow Instructions

### Starting Development
1. Read `guide.md` completely before coding
2. Check `prd.md` for product requirements
3. Verify environment variables are set
4. Run database migrations in Supabase
5. Start development with `npm run dev`

### Adding New Features
1. Create feature branch: `git checkout -b feature/name`
2. Update relevant documentation first
3. Implement following guide.md patterns
4. Write Playwright tests for new functionality
5. Test on mobile and desktop
6. Run full test suite before committing
7. Update this claude.md if new patterns emerge

### Testing Workflow
1. Write Playwright tests BEFORE implementing features
2. Test authentication flows thoroughly
3. Verify responsive design on all breakpoints
4. Test widget integration on sample HTML page
5. Check cross-browser compatibility
6. Validate mobile touch interactions

### Deployment Process
1. Run `npm run build` successfully
2. Verify all tests pass: `npm run test`
3. Check bundle sizes are within limits
4. Test on staging environment
5. Deploy to production via Vercel
6. Verify widget CDN is serving correctly

## Component Development Patterns

### shadcn/ui Usage
- Use shadcn/ui components for ALL interface elements
- Install components as needed: `npx shadcn@latest add [component]`
- Customize via Tailwind classes, not custom CSS
- Ensure mobile accessibility for all interactions

### React Patterns
```typescript
// Preferred component structure
'use client'; // Only when needed

import { useState, useTransition } from 'react';
import { ComponentProps } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function MyComponent({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Implementation
  
  return (
    <div className="mobile-first-classes md:desktop-classes">
      {/* shadcn/ui components */}
    </div>
  );
}
```

### Database Interaction Patterns
```typescript
// Server Components (preferred)
import { createServerComponentClient } from '@/lib/supabase';

export default async function ServerPage() {
  const supabase = createServerComponentClient();
  const { data } = await supabase.from('table').select('*');
  return <div>{/* render data */}</div>;
}

// Client Components (when needed)
'use client';
import { createClient } from '@/lib/supabase';

export function ClientComponent() {
  const supabase = createClient();
  // Use with useEffect or event handlers
}
```

## Debugging Instructions

### Widget Debugging
- Enable debug mode: Add `data-debug` to script tag
- Check browser console for widget logs
- Verify API key exists in projects table
- Test on different domains and frameworks

### Dashboard Debugging
- Check Supabase logs for database errors
- Verify RLS policies allow user access
- Test authentication flow completely
- Check responsive design at all breakpoints

### API Debugging
- Monitor rate limiting behavior
- Validate CORS headers are correct
- Check input validation is working
- Verify service role key is server-only

## Special Instructions

### When Building Components
1. Start with mobile design (320px width)
2. Use shadcn/ui components as foundation
3. Add Tailwind responsive classes progressively
4. Test touch interactions on actual devices
5. Ensure proper keyboard navigation
6. Add loading states for all async operations

### When Writing Tests
1. Focus on user journeys, not implementation details
2. Test responsive behavior at different viewports
3. Verify accessibility features work correctly
4. Test error scenarios and edge cases
5. Ensure tests run reliably in CI environment

### When Debugging Issues
1. Check the troubleshooting section in guide.md first
2. Verify environment variables are set correctly
3. Test with fresh browser session (clear cache/cookies)
4. Check network tab for failed requests
5. Review Supabase logs for database issues

## Communication Style

When working on this project:
- Ask clarifying questions if requirements are unclear
- Explain your reasoning for technical decisions
- Highlight any deviations from the guide and why
- Suggest improvements when you spot them
- Request confirmation for significant architectural changes

## Success Criteria

The project is successful when:
- Widget loads in <100ms and stays <20KB
- Dashboard works flawlessly on mobile and desktop
- All Playwright tests pass consistently
- Authentication flow is smooth and secure
- Feedback submission works end-to-end
- Code follows all style and security guidelines

Remember: You're building a production MVP that developers will actually use. Quality and attention to detail matter more than speed of delivery.