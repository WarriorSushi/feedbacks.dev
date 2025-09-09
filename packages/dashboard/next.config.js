/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.feedbacks.dev', 'www.feedbacks.dev', 'feedbacks.dev'],
    },
  },
  eslint: {
    // Avoid CI/build failures due to workspace hoisting of eslint-config-next parser.
    // We still run lint in CI separately.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
