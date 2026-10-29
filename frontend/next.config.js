/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = process.env.PASSMATE_BACKEND_URL ?? 'http://127.0.0.1:8080';
    return [{source:'/api/:path*', destination:`${backend}/api/:path*`}];
  },
  swcMinify: true,
  
  // PWA configuration
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
