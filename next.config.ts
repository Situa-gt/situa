import type { NextConfig } from "next";
import { createClient } from "@supabase/supabase-js";

async function fetchLegacyRedirects(): Promise<
  { source: string; destination: string; permanent: boolean }[]
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase
      .from("legacy_redirects")
      .select("old_path, new_path, status_code");

    if (error) throw error;

    return (data ?? [])
      .filter((r) => r.new_path.startsWith("/")) // reject absolute URLs — prevents open redirect
      .map((r) => ({
        source: r.old_path,
        destination: r.new_path,
        permanent: r.status_code === 308 || r.status_code === 301,
      }));
  } catch (err) {
    console.warn("[next.config] Could not fetch legacy redirects:", err);
    return [];
  }
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://fxgbmjiymthrteqtakbg.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
      "connect-src 'self' https://fxgbmjiymthrteqtakbg.supabase.co https://www.google-analytics.com",
      "font-src 'self'",
      "frame-src https://www.openstreetmap.org",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fxgbmjiymthrteqtakbg.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    const legacy = await fetchLegacyRedirects();
    console.log(`[next.config] Loaded ${legacy.length} legacy redirects`);
    return legacy;
  },
};

export default nextConfig;
