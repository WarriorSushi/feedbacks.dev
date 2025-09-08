/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.feedbacks.dev', 'www.feedbacks.dev', 'feedbacks.dev'],
    },
  },
};

module.exports = nextConfig;
