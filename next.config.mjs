/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      crypto: false,
      stream: false,
      path: false,
      buffer: false,
      util: false,
      assert: false,
      os: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:assert': 'assert',
      'node:os': 'os',
    };
    return config;
  },
};

export default nextConfig;
