/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  turbopack: {
    root:'.',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized:true,
  },
};

module.exports = nextConfig;