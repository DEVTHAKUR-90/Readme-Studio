/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  /**
   * Don't fail the production build on ESLint issues.
   *
   * Vercel's build step runs lint by default and treats every rule violation
   * as fatal — even cosmetic ones like `react/no-unescaped-entities` where
   * a stray apostrophe aborts the whole deploy. That's a lousy experience
   * for a project where the build itself (the TypeScript compile + webpack
   * pack) is genuinely correct.
   *
   * We still want to SEE lint errors locally, so `npm run lint` will keep
   * reporting them — this flag only silences them during `next build`.
   *
   * TypeScript errors still fail the build (see `typescript` config below)
   * because those represent actual bugs, not style nits.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep the type-check as a hard gate — a type error IS a bug.
    ignoreBuildErrors: false,
  },
  // Next 14 + webpack 5 support `new URL(..., import.meta.url)` for workers
  // out of the box. No custom loader rule needed.
  webpack: (config) => {
    // Monaco ships `.ttf` fonts – tell webpack to asset-resource them so they
    // don't trigger the default JS loader.
    config.module.rules.push({
      test: /\.ttf$/,
      type: "asset/resource",
    });
    return config;
  },
};

module.exports = nextConfig;

