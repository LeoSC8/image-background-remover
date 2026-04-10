/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID,
    NEXT_PUBLIC_PAYPAL_VIP_PLAN_ID: process.env.NEXT_PUBLIC_PAYPAL_VIP_PLAN_ID,
  },
}

module.exports = nextConfig
