/** @type {import('next').NextConfig} */

function safeHostname(raw) {
  if (!raw) return null
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw}`
    return new URL(url).hostname
  } catch { return raw }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.VERCEL_URL,
        safeHostname(appUrl),
      ].filter(Boolean),
      bodySizeLimit: '11mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.vercel.app' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },  // S3
      ...(appUrl ? [{ protocol: 'https', hostname: safeHostname(appUrl) }] : []),
    ],
  },
}
module.exports = nextConfig
