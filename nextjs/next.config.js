const env = require('dotenv')
env.config()

const imageRemotePatterns = []

const ENV = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'
const BACKEND_URL =
  (ENV !== 'production'
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : process.env.NEXT_PUBLIC_PROD_BACKEND_URL) || 'http://127.0.0.1:8000'

if (BACKEND_URL) {
  const hostname = new URL(BACKEND_URL).hostname
  imageRemotePatterns.push({
    protocol: 'http',
    hostname,
  })
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  async headers() {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
      ? [
          {
            source: '/',
            headers: [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=600; includeSubDomains; preload',
              },
            ],
          },
        ]
      : []
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.localintelligencehub.com',
      },
      {
        protocol: 'https',
        hostname: 'uploads.commonknowledge.coop',
      },
      // {
      //   protocol: 'http',
      //   hostname: '127.0.0.1',
      // },
      {
        protocol: 'http',
        hostname: 'api.mapped.commonknowledge.coop',
      },
      ...imageRemotePatterns,
    ],
  },
  experimental: {
    turbo: {
      // This is a default option, include it to squash
      // "turbopack is not configured" warning.
      useSwcCss: false,
    },
  },
}

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG_ID,
    project: process.env.SENTRY_PROJECT_ID,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers. (increases server load)
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
)
