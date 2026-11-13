import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // JustMyType's "Send to OnYourMark" button opens the site root with
      // the pairing in ?jmt=; the tool itself now lives at /studio. The
      // query string carries over.
      { source: "/", has: [{ type: "query", key: "jmt" }], destination: "/studio", permanent: false },
    ];
  },
};

export default nextConfig;
