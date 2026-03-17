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
  async headers() {
    const supabaseOrigin = 'https://xiiaugllydxxmjbtzfux.supabase.co';
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `img-src 'self' data: ${supabaseOrigin} https://lh3.googleusercontent.com;`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
