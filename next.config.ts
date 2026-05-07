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

    return (data ?? []).map((r) => ({
      source: r.old_path,
      destination: r.new_path,
      permanent: r.status_code === 308 || r.status_code === 301,
    }));
  } catch (err) {
    console.warn("[next.config] Could not fetch legacy redirects:", err);
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "fxgbmjiymthrteqtakbg.supabase.co" },
    ],
  },
  async redirects() {
    const legacy = await fetchLegacyRedirects();
    console.log(`[next.config] Loaded ${legacy.length} legacy redirects`);
    return legacy;
  },
};

export default nextConfig;
