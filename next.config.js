/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.cosmicjs.com',
      'imgix.cosmicjs.com',
      'images.unsplash.com'
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@cosmicjs/sdk']
  }
}

module.exports = nextConfig