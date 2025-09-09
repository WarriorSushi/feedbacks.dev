# feedbacks.dev

<div align="center">

![feedbacks.dev Logo](https://img.shields.io/badge/feedbacks-dev-2563eb?style=for-the-badge&logo=react)

**A lightweight, developer-first feedback widget that embeds in any website with one line of code**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

[🚀 Live Demo](https://feedbacks.dev) • [📖 Documentation](./CLAUDE.md) • [🐛 Report Bug](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=bug_report.md) • [💡 Request Feature](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=feature_request.md)

</div>

## ✨ Features

- **🪶 Lightweight**: Under 20KB gzipped - won't slow down your site
- **⚡ Fast**: Loads in <100ms globally with CDN distribution  
- **📱 Mobile-First**: Responsive design that works on any device
- **🔧 Developer-Friendly**: Simple API, TypeScript support, clear docs
- **🎨 Customizable**: Position, colors, and styling options
- **🔒 Secure**: Rate limiting, input validation, and privacy-focused
- **🌍 Cross-Platform**: Works with React, Vue, vanilla HTML, and mobile apps

## Quick Start

### 1. Add the widget to your site

```html
<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="feedbacks_dev_api_key_abc123"
  defer>
</script>
```

### 2. Get feedback instantly

That's it! Users can now submit feedback directly from your website.

## What's in the box?

### Widget
- Vanilla TypeScript implementation
- Mobile-responsive CSS animations
- Auto-captures page context
- Accessibility features built-in

### Dashboard
- Next.js 14 with App Router
- shadcn/ui components for premium feel
- Real-time feedback management
- Project organization

### API
- Secure feedback submission
- Rate limiting (10 req/min per IP)
- Input validation and sanitization
- Supabase backend with RLS

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/WarriorSushi/feedbacks.dev.git
cd feedbacks.dev

# Install dependencies
npm install

# Install widget dependencies
cd packages/widget && npm install && cd ../..

# Install dashboard dependencies  
cd packages/dashboard && npm install && cd ../..

# Set up environment variables
cp packages/dashboard/.env.example packages/dashboard/.env.local
# Add your Supabase credentials to .env.local
```

### Environment Variables

Create `packages/dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL migrations:
   ```sql
   -- Copy and paste contents of sql/001_initial_schema.sql
   -- Then copy and paste contents of sql/002_rls_policies.sql
   ```

### Development Commands

```bash
# Start dashboard development server
npm run dashboard:dev

# Start widget development server  
npm run widget:dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide
- **[guide.md](./guide.md)** - Step-by-step implementation guide  
- **[prd.md](./prd.md)** - Product requirements and specifications

## 🏗️ Project Structure

```
feedbacks.dev/
├── packages/
│   ├── widget/          # Vanilla TypeScript widget
│   │   ├── src/
│   │   │   ├── widget.ts    # Main widget logic
│   │   │   ├── styles.css   # Mobile-first CSS
│   │   │   └── types.ts     # TypeScript definitions
│   │   └── webpack.config.js
│   └── dashboard/       # Next.js dashboard
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   └── lib/         # utilities and types
│       └── tailwind.config.js
├── sql/                 # Database migrations
│   ├── 001_initial_schema.sql
│   └── 002_rls_policies.sql
└── docs/               # Additional documentation
```

## 🚢 Deployment

### Widget (CDN)
The widget is designed to be served from a CDN for global performance:

```bash
# Build the widget
npm run widget:build

# Deploy dist/widget-1.0.0.js to your CDN
# Configure proper caching headers
```

### Dashboard (Vercel)
The dashboard deploys seamlessly to Vercel:

```bash
# Build the dashboard
npm run dashboard:build

# Deploy to Vercel
npx vercel deploy
```

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run type checking: `npm run type-check`
5. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
6. Push and create a Pull Request

## 🐛 Issues & Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Create an issue](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=feature_request.md)
- 💬 **Questions**: [Start a discussion](https://github.com/WarriorSushi/feedbacks.dev/discussions)

## 📊 Roadmap

- [ ] **v1.1**: Screenshot capture with feedback
- [ ] **v1.2**: Slack/Discord webhook integrations  
- [ ] **v1.3**: Advanced analytics dashboard
- [ ] **v1.4**: Native mobile SDKs (iOS/Android)
- [ ] **v1.5**: White-label options for agencies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components  
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

<div align="center">

**Made with ❤️ for developers who care about user feedback**

[Website](https://feedbacks.dev) • [Twitter](https://twitter.com/feedbacksdev) • [Discord](https://discord.gg/feedbacksdev)

</div>

## Documentation

- Main guide: `guide.md`
- Security, SRI and CSP: `docs/SECURITY_AND_CSP.md`
- Database migrations: `docs/MIGRATIONS.md`
- Rate limiting options: `docs/RATE_LIMITING.md`
