/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/ai-agents',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
