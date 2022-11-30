/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}
const IMGIX_URL = "nina-dev.imgix.net"
module.exports = {
  ...nextConfig,
  env: {
    IMGIX_URL,
    NINA_API_ENDPOINT: process.env.NINA_API_ENDPOINT,
    NINA_PROGRAM_ID: process.env.NINA_PROGRAM_ID,
    NINA_HUB_ID: process.env.NINA_HUB_ID,
    SOLANA_CLUSTER_URL: process.env.SOLANA_CLUSTER_URL,
    SHOW_ARTIST_NAME: process.env.SHOW_ARTIST_NAME,
    IMGIX_TOKEN: process.env.IMGIX_TOKEN,
  },
  images: {
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920, 2048],
    domains: ["www.arweave.net", "arweave.net"],
  },
}
