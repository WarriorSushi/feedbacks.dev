/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.feedbacks.dev'],
    },
  },
  async headers() {
    return [
      {
        source: '/widget/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/widget/:path*',
        destination: '/api/widget/:path*',
      },
    ];
  },
};

module.exports = nextConfig;