# feedbacks.dev - Product Requirements Document

## Executive Summary

**feedbacks.dev** is a lightweight, developer-first feedback widget that can be embedded into any website or mobile app with a single line of code. It provides a simple way for users to submit feedback directly from your product, with a clean dashboard to manage and respond to submissions.

**Mission**: Make collecting user feedback as easy as adding Google Analytics - one line of code, instant feedback collection.

## Problem Statement

- Existing feedback tools are bloated, expensive, or hard to integrate
- Developers want something lightweight that doesn't slow down their sites
- Teams need a simple way to collect, organize, and act on user feedback
- Current solutions often require complex setup or vendor lock-in

## Target Users

**Primary**: Web developers and indie makers building SaaS products, portfolios, or content sites
**Secondary**: Mobile app developers looking for cross-platform feedback solutions
**Enterprise**: Teams wanting a simple, embeddable feedback system

## Core Value Propositions

1. **One-line integration** - Copy/paste a script tag, get instant feedback collection
2. **Lightweight** - Widget stays under 20KB to maintain site performance  
3. **Cross-platform** - Works on websites, web apps, and mobile apps (React Native, Flutter, etc.)
4. **Developer-friendly** - Simple API, clear docs, no vendor lock-in
5. **Generous free tier** - Perfect for side projects and early-stage products

## MVP Features (Phase 1)

### Widget
- **Text feedback form** with optional email capture
- **Floating button** that opens modal overlay
- **Auto-capture context**: page URL, user agent
- **Customizable styling** (basic theming)
- **Mobile responsive** design

### Dashboard (app.feedbacks.dev)
- **Authentication** via email magic link or GitHub
- **Project management** - create projects, get API keys
- **Feedback inbox** - list all feedback with read/unread status
- **Basic filtering** by project, read status, date
- **Feedback detail view** with full context

### API
- **POST /api/feedback** - receive and store feedback
- **Project key validation** - ensure feedback goes to right project
- **Basic validation** - message length, required fields

### Infrastructure
- **Vercel hosting** for widget, API, and dashboard
- **Supabase** for database, auth, and file storage
- **Global CDN** for fast widget loading worldwide

## Technical Specifications

### Database Schema
```sql
-- Projects table
projects (
  id uuid primary key,
  name text not null,
  api_key text unique not null,
  owner_user_id uuid not null, -- Supabase Auth user
  created_at timestamptz default now()
)

-- Feedback table  
feedback (
  id uuid primary key,
  project_id uuid references projects(id),
  message text not null,
  email text nullable,
  url text not null, -- Page where feedback was submitted
  user_agent text not null, -- Browser/device info
  is_read boolean default false,
  created_at timestamptz default now()
)
```

### Widget Integration

**Websites:**
```html
<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="pk_live_abc123"
  defer>
</script>
```

**React/Next.js:**
```javascript
import { FeedbackWidget } from '@feedbacks/react'
<FeedbackWidget projectKey="pk_live_abc123" />
```

**Mobile Apps (React Native):**
```javascript
import { FeedbackModal } from '@feedbacks/react-native'
// WebView-based integration or native modal
```

**Flutter:**
```dart
// WebView integration or platform-specific implementation
FeedbackWidget(projectKey: 'pk_live_abc123')
```

### API Endpoints

```typescript
// POST /api/feedback
interface FeedbackRequest {
  apiKey: string
  message: string
  email?: string
  url: string
}

interface FeedbackResponse {
  id: string
  success: boolean
}
```

## Platform Support

### Web
- ✅ **Vanilla HTML/CSS/JS** - Script tag integration
- ✅ **React/Vue/Angular** - Component wrappers
- ✅ **Next.js/Nuxt/SvelteKit** - SSR compatible
- ✅ **WordPress/Shopify** - Plugin/theme integration

### Mobile
- ✅ **React Native** - WebView or native modal
- ✅ **Flutter** - WebView integration
- ✅ **Ionic/Cordova** - Web-based apps
- 🔄 **Native iOS/Android** - Future native SDKs

### Backend Integration
- ✅ **REST API** for custom integrations
- 🔄 **Webhooks** for real-time notifications
- 🔄 **GraphQL** for advanced querying

## Pricing Strategy

### Free Tier
- 1 project
- 100 feedback submissions/month
- Basic dashboard
- "Powered by feedbacks.dev" badge
- **Unlimited for open source projects**

### Pro Tier ($19/month)
- 5 projects
- 1,000 feedback/month
- Remove branding badge
- Slack integration
- Priority support

### Team Tier ($49/month)
- Unlimited projects
- 10,000 feedback/month
- GitHub/Linear integrations
- Team collaboration features
- Advanced analytics

## Growth Plan (Future Phases)

### Phase 2: Enhanced Features
- **Screenshots/screen recording** via Cloudinary
- **Slack/Discord webhooks** for instant notifications
- **GitHub/Linear issue creation** from feedback
- **Advanced tagging and filtering**

### Phase 3: Analytics & Insights
- **Feedback analytics dashboard**
- **Sentiment analysis** of feedback
- **Trending issues detection**
- **Export capabilities** (CSV, API)

### Phase 4: Advanced Integrations
- **Native mobile SDKs** (iOS/Android)
- **Zapier integration** for workflow automation
- **Custom webhooks** for any service
- **White-label options** for agencies

## Success Metrics

### MVP Goals (3 months)
- 100 registered projects
- 10,000 feedback submissions processed
- 10 paying customers
- <50ms widget load time globally

### Long-term Goals (12 months)
- 1,000+ active projects
- 100+ paying customers
- 99.9% uptime
- Recognized as go-to feedback tool for indie developers

## Technical Requirements

### Performance
- **Widget load time**: <100ms globally
- **Widget size**: <20KB gzipped
- **API response time**: <200ms p95
- **Dashboard load time**: <1s initial load

### Security
- **HTTPS everywhere**
- **CORS protection** for widget
- **Input validation** and sanitization
- **Rate limiting** to prevent spam
- **Future: HMAC signatures** for integrity

### Scalability
- **Serverless architecture** scales to zero and beyond
- **CDN distribution** for global performance
- **Database connection pooling** via Supabase
- **Horizontal scaling** ready with Vercel/Supabase

## Competitive Analysis

- **Hotjar/FullStory**: Too heavy, expensive, overkill for simple feedback
- **Typeform**: Not embeddable, separate flow
- **Intercom**: Chat-focused, complex setup
- **UserVoice**: Enterprise-focused, dated UX

**Our Advantage**: Simplest possible integration + developer experience + generous free tier.

## Risk Assessment

### Technical Risks
- **Widget compatibility** across browsers/frameworks
- **Performance impact** on host sites
- **Spam prevention** without friction

### Business Risks  
- **Market saturation** with feedback tools
- **Monetization timing** - balance free vs paid features
- **Customer acquisition** in crowded dev tools space

### Mitigation Strategies
- Extensive browser/framework testing
- Performance budgets and monitoring
- Community building and developer advocacy
- Focus on superior developer experience

## Launch Strategy

### Pre-Launch (2 weeks)
- Build MVP according to simplified spec
- Internal testing across different sites/frameworks
- Create basic landing page and documentation

### Soft Launch (4 weeks)  
- Share with 10-20 developer friends
- Collect feedback and iterate rapidly
- Document common integration patterns

### Public Launch (8 weeks)
- Product Hunt launch
- Developer community outreach (Reddit, Discord, Twitter)
- Content marketing around feedback collection best practices

## Definition of Done (MVP)

### Widget
- [x] Loads in <100ms, <20KB gzipped
- [x] Text feedback submission works
- [x] Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- [x] Mobile responsive
- [x] Captures URL and user agent automatically

### Dashboard
- [x] User can sign up/sign in with email or GitHub
- [x] Create new projects and get API keys
- [x] View all feedback for their projects
- [x] Mark feedback as read/unread
- [x] Responsive design for mobile use

### Infrastructure
- [x] Widget served from global CDN
- [x] API handles 100 requests/second
- [x] Database properly indexed for performance
- [x] Basic error handling and logging

**Success Criteria**: A developer can add feedbacks.dev to their site in under 60 seconds and start collecting feedback immediately.