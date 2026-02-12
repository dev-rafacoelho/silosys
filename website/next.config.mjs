/** @type {import('next').NextConfig} */
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim();

const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/auth", destination: `${apiUrl}/auth` },
      { source: "/auth/:path*", destination: `${apiUrl}/auth/:path*` },
      { source: "/armazens", destination: `${apiUrl}/armazens` },
      { source: "/armazens/:path*", destination: `${apiUrl}/armazens/:path*` },
    ];
  },
};

export default nextConfig;
