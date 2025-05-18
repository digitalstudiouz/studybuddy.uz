import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'oaidalleapiprodscus.blob.core.windows.net',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ отключает падение билда из-за ошибок линтера
  },
};

const withNextIntl = createNextIntlPlugin();

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(withNextIntl(nextConfig));

export default config;
