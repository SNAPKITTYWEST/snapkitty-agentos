/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/snapkitty-agentos',
  trailingSlash: true,
};

module.exports = nextConfig;
