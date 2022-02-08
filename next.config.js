const isDev = process.env.NODE_ENV !== 'production'
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
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'none'",
              "child-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "worker-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              [
                "font-src",
                // for the excalidraw Block
                "https://unpkg.com/@excalidraw/",
              ].join(" "),
              [
                "frame-src",
                // for sandboxed embeds
                "https://codesandbox.io/",
              ].join(" "),
              [
                "script-src",
                "'self'",
                "'unsafe-eval'",
                // "https://raw.githubusercontent.com/",
                // for using Tailwind styles in example Blocks
                "https://cdn-tailwindcss.vercel.app/",
                // for the excalidraw Block
                "https://unpkg.com/@excalidraw/",
              ].join(" "),
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
                "https://raw.githubusercontent.com/",
                // for hitting the GitHub API
                "https://api.github.com/",
                // for getting the source code for custom Blocks
                "https://blocks-marketplace.vercel.app/",
                // for sandboxes in the MDX Block
                "https://codesandbox.io/api/v1/sandboxes/",
              ].filter(Boolean).join(" "),
            ].join(";"),
          }, {
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