# Contributing to feedbacks.dev

First off, thanks for taking the time to contribute! Every contribution matters, from typo fixes to entire features.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Supabase** account (free tier works)

### Local Development

```bash
# Clone the repo
git clone https://github.com/WarriorSushi/feedbacks.dev-2026.git
cd feedbacks.dev-2026

# Install dependencies
pnpm install

# Set up environment variables
cp packages/dashboard/.env.example packages/dashboard/.env.local
# Fill in your Supabase credentials

# Run database migrations
# Execute SQL files in sql/ folder in order against your Supabase project

# Start the dev server
pnpm dev
```

### Project Structure

```
packages/
  dashboard/    # Next.js 15 app (main product)
  widget/       # Embeddable feedback widget (<20KB)
  widget-react/ # React wrapper for the widget
  widget-vue/   # Vue wrapper for the widget
  shared/       # Shared types and utilities
  mcp-server/   # MCP server for AI agent integration
```

## How to Contribute

### Reporting Bugs

- Use [GitHub Issues](https://github.com/WarriorSushi/feedbacks.dev-2026/issues)
- Include steps to reproduce, expected vs actual behavior
- Add screenshots if it's a UI issue

### Suggesting Features

- Open a [GitHub Issue](https://github.com/WarriorSushi/feedbacks.dev-2026/issues) with the "enhancement" label
- Or submit it on our own [public board](https://feedbacks.dev/boards)

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Run `pnpm type-check` to verify TypeScript
4. Run `pnpm build` to verify the build passes
5. Write a clear PR description explaining what and why
6. Submit your PR

### Code Style

- **TypeScript strict mode** everywhere
- **Functional React** with hooks (no class components)
- **pnpm** only (never npm or yarn)
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, etc.
- No `any` types in new code

### What We're Looking For

- Bug fixes
- Performance improvements
- Accessibility improvements
- Documentation improvements
- New integrations (webhook providers, etc.)
- Widget customization options
- Translations

## Code of Conduct

Be kind, be respectful, be constructive. We're building something useful together.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
