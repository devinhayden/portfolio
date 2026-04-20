/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 768, 1200, 1920],
    imageSizes: [192, 390],
  },
};

export default nextConfig;
