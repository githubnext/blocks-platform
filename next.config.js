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
              "frame-ancestors 'none'",
              "object-src 'none'",
              "worker-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              [
                "frame-src",
                // for sandboxed embeds
                "https://0-10-11-sandpack.codesandbox.io/",
                "https://0-19-1-sandpack.codesandbox.io/",
              ].join(" "),
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
                // for fetching file contents from GitHub
                "https://raw.githubusercontent.com/",
                // for hitting the GitHub API
                "https://api.github.com/",
                // for getting the source code for custom Blocks
                process.env.NEXT_PUBLIC_MARKETPLACE_URL,
                // for sandboxes in the MDX Block
                "https://codesandbox.io/api/v1/sandboxes/",
                // for Analytics
                "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
                // for sentence-encoder-block
                "https://tfhub.dev/google/tfjs-model/universal-sentence-encoder-qa-ondevice/",
                "https://storage.googleapis.com/tfhub-tfjs-modules/google/tfjs-model/universal-sentence-encoder-qa-ondevice/",
                // for 3d-model block
                "blob:",
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
