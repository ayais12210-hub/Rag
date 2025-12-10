/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lumina/ui"],
  eslint: { ignoreDuringBuilds: true } 
}
module.exports = nextConfig