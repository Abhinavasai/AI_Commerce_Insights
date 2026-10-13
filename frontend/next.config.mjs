/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the demo SQLite driver in the Node serverless runtime on Vercel
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("better-sqlite3");
    }
    return config;
  },
};

export default nextConfig;
