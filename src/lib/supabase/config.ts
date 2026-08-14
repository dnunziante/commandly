export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function shouldUseLocalDemoMode(
  nodeEnvironment?: string,
  localDemoFlag?: string,
  publicDemoFlag?: string,
) {
  return publicDemoFlag === "true" || (nodeEnvironment !== "production" && localDemoFlag === "true");
}

export function isLocalDemoMode() {
  return shouldUseLocalDemoMode(
    process.env.NODE_ENV,
    process.env.LOCAL_DEMO_MODE,
    process.env.PUBLIC_DEMO_MODE,
  );
}

export const publicDemoCookieName = "commandly-public-demo";

export function safeDemoNextPath(value?: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/admin")
    ? value
    : "/dashboard";
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, publishableKey };
}
