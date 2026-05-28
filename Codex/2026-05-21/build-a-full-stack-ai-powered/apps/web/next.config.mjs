/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@surakshanet/shared"],
  experimental: { optimizePackageImports: ["lucide-react"] }
};

export default nextConfig;
