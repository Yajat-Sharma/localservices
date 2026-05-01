/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next 15: remotePatterns replaces the deprecated `domains` array
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 300,

  // Next 15: serverExternalPackages is now a top-level key
  // (replaces experimental.serverComponentsExternalPackages from Next 14)
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "nodemailer"],
};

module.exports = nextConfig;