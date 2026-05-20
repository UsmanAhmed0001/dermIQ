/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api-inference.huggingface.co' }
    ]
  }
}

module.exports = nextConfig
