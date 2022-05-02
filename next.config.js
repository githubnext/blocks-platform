const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
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
              "frame-ancestors 'self'",
              "object-src 'none'",
              "worker-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "frame-src 'self'",
              [
                "script-src",
                "'self'",
                isDev && "'unsafe-eval'",
                // "https://raw.githubusercontent.com/",
                // for using Tailwind styles in example Blocks
                "https://cdn-tailwindcss.vercel.app/",
              ]
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
                // for getting the source code for custom Blocks
                process.env.NEXT_PUBLIC_MARKETPLACE_URL,
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
      {
        source: "/block-iframe/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "sandbox allow-scripts",
              "default-src *",
              "base-uri 'none'",
              "child-src 'none'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "worker-src 'self'",
              "connect-src * blob:",
              "style-src 'unsafe-inline' *",
              "frame-src 'none'",
              ["script-src", "'unsafe-eval'", "'unsafe-inline'", "*"]
                .filter(Boolean)
                .join(" "),
              ["img-src", "*"].join(" "),
              ["connect-src", "*"].filter(Boolean).join(" "),
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
