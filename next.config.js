const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  publicRuntimeConfig: {
    sandboxDomain: process.env.NEXT_PUBLIC_SANDBOX_DOMAIN,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'none'",
              "child-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "worker-src 'none'",
              "style-src 'self' 'unsafe-inline'",
              // unfortunately the following is evaluated at build time
              // but we need it to be different in staging vs. production
              // so we leave it off here (default is 'none')
              // and add it using `publicRuntimeConfig` in `[repo]/index.tsx`
              // `frame-src ${process.env.NEXT_PUBLIC_SANDBOX_DOMAIN}`,
              ["script-src", "'self'", isDev && "'unsafe-eval'"]
                .filter(Boolean)
                .join(" "),
              [
                "img-src",
                "'self'",
                // for images in an HTML block
                "https: data:",
              ].join(" "),
              [
                "connect-src",
                "'self'",
                // for local dev
                isDev && "webpack://*",
                isDev && "ws://*",
                // for hitting the GitHub API
                "https://api.github.com/",
                // for Analytics
                "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
              ]
                .filter(Boolean)
                .join(" "),
            ].join(";"),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};
