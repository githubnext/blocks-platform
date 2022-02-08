module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  env: {
    PASSWORD_PROTECT: process.env.NEXT_PUBLIC_VERCEL_ENV !== 'development',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        }, {
          //   key: "X-Frame-Options",
          //   value: "SAMEORIGIN",
          // }, {
          key: "X-XSS-Protection",
          value: "0",
        }, {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        ],
      },
    ]
  },
}