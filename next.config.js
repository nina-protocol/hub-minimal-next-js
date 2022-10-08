/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = {
  ...nextConfig,
  env: {
    NINA_API_ENDPOINT: process.env.NINA_API_ENDPOINT,
    NINA_PROGRAM_ID: process.env.NINA_PROGRAM_ID,
    NINA_HUB_ID: process.env.NINA_HUB_ID,
    SOLANA_CLUSTER_URL: process.env.SOLANA_CLUSTER_URL,
  }
}
