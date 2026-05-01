/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next 15: use remotePatterns instead of deprecated `domains`
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 300,

  experimental: {
    // Next 15: renamed from serverComponentsExternalPackages →
    // serverExternalPackages (moved out of experimental)
  },

  // Next 15: serverExternalPackages is now a top-level key
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "nodemailer"],
};

module.exports = nextConfig;