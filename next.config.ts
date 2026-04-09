import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '44342',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'icamau.camau.gov.vn',
        // Không cần port nếu là cổng mặc định (443)
        pathname: '/**', // Cho phép tất cả các đường dẫn từ host này
      },
    ],
  },
};

export default nextConfig;