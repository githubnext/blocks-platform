module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  env: {
    PASSWORD_PROTECT: process.env.NEXT_PUBLIC_VERCEL_ENV !== 'development',
  }
}