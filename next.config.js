const withTM = require('next-transpile-modules')(['monaco-editor']);

module.exports = withTM({
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
})