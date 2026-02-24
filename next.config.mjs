/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3002", "*.vercel.app", "hub.selfservice.io.vn"]
    }
  },
}

export default nextConfig;