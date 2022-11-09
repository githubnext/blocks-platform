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
    functionsUrl: process.env.NEXT_PUBLIC_FUNCTIONS_URL,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // unfortunately the following is evaluated at build time but we
            // need `frame-src` and `connect-src` to be different in staging vs.
            // production, so we leave them off here (default is 'none') and add
            // them in `index.tsx` and `[owner]/[repo]/index.tsx`
            value: [
              "default-src 'self'",
              "base-uri 'none'",
              "child-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "worker-src 'none'",
              "style-src 'self' 'unsafe-inline'",
              ["script-src", "'self'", isDev && "'unsafe-eval'"]
                .filter(Boolean)
                .join(" "),
              [
                "img-src",
                "'self'",
                // for images in an HTML block
                "https: data:",
              ].join(" "),
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
