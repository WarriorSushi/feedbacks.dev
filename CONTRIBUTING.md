# Contributing to feedbacks.dev

Thank you for your interest in contributing to feedbacks.dev! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new functionality
- 📝 **Documentation**: Improve our guides and examples
- 🎨 **Design**: Enhance UI/UX and visual elements
- 💻 **Code**: Implement features and fix bugs
- 🧪 **Testing**: Add test coverage and quality assurance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with npm
- Git for version control
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/feedbacks.dev.git
   cd feedbacks.dev
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd packages/widget && npm install && cd ../..
   cd packages/dashboard && npm install && cd ../..
   ```

3. **Set Up Environment**
   ```bash
   cp packages/dashboard/.env.example packages/dashboard/.env.local
   # Add your Supabase credentials
   ```

4. **Start Development**
   ```bash
   npm run dashboard:dev  # Dashboard on :3000
   npm run widget:dev     # Widget on :3001
   ```

## 📋 Development Workflow

### Branch Naming
Use descriptive branch names:
- `feature/add-screenshot-capture`
- `fix/mobile-styling-issue`
- `docs/update-api-examples`
- `refactor/widget-architecture`

### Commit Messages
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add screenshot capture functionality
fix: resolve mobile viewport issues
docs: update API documentation
style: improve button hover animations
refactor: optimize widget bundle size
test: add integration tests for feedback API
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run type-check     # TypeScript validation
   npm run test          # Run test suite (when available)
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Provide clear description of changes
   - Reference related issues
   - Add screenshots for UI changes

## 🎯 Development Guidelines

### Code Style

**TypeScript**
- Use strict TypeScript configuration
- No `any` types unless absolutely necessary
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names

**React Components**
- Functional components with hooks only
- Use proper TypeScript prop definitions
- Follow shadcn/ui patterns for consistency
- Mobile-first responsive design

**CSS/Styling**
- Use Tailwind CSS utility classes
- Mobile-first approach (320px → 1920px)
- Consistent spacing and color usage
- Accessible color contrast ratios

### Widget Development
- Keep bundle size under 20KB gzipped
- Ensure cross-browser compatibility
- Test on actual mobile devices
- Maintain accessibility standards
- Use semantic HTML elements

### Dashboard Development
- Follow Next.js 14 App Router patterns
- Use Server Components where possible
- Implement proper error boundaries
- Ensure responsive design
- Add loading states for async operations

## 🧪 Testing

### Manual Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile responsiveness
- Test with screen readers
- Validate form inputs and error states

### Automated Testing
```bash
# TypeScript validation
npm run type-check

# Linting (when configured)
npm run lint

# Unit tests (when available)
npm run test

# E2E tests (when configured)  
npm run test:e2e
```

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Numbered steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, screen size
- **Screenshots**: Visual evidence if applicable
- **Console Errors**: Any JavaScript errors

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)

## 💡 Feature Requests

For new features, please include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternative Solutions**: Other approaches considered
- **Use Cases**: When would this be useful?
- **Implementation Ideas**: Technical approach (optional)

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

## 📖 Documentation

### Writing Guidelines
- Use clear, concise language
- Provide working code examples
- Include screenshots for UI features
- Test all code examples
- Update table of contents when needed

### Areas Needing Documentation
- API endpoint documentation
- Widget customization options
- Dashboard feature guides
- Deployment instructions
- Troubleshooting guides

## 🔒 Security

### Reporting Security Issues
Please **DO NOT** create public issues for security vulnerabilities.

Instead, email: security@feedbacks.dev

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if known)

### Security Best Practices
- Never commit API keys or secrets
- Validate all user inputs
- Use HTTPS everywhere
- Follow OWASP guidelines
- Regular dependency updates

## 📚 Resources

### Documentation
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [guide.md](./guide.md) - Implementation guide
- [prd.md](./prd.md) - Product requirements

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎉 Recognition

Contributors will be:
- Listed in our README contributors section
- Mentioned in release notes for significant contributions
- Invited to our contributors Discord channel
- Eligible for feedbacks.dev swag

## 📞 Getting Help

- 💬 **Discord**: Join our [contributor chat](https://discord.gg/feedbacksdev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/feedbacks.dev/issues)
- 💭 **Discussions**: [GitHub Discussions](https://github.com/your-username/feedbacks.dev/discussions)
- 📧 **Email**: contribute@feedbacks.dev

## 🙏 Thank You

Every contribution makes feedbacks.dev better for developers worldwide. Whether you're fixing a typo, adding a feature, or improving documentation - thank you for being part of our community!

---

**Happy coding! 🚀**