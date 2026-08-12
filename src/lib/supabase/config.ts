export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function shouldUseLocalDemoMode(nodeEnvironment?: string, demoFlag?: string) {
  return nodeEnvironment !== "production" && demoFlag === "true";
}

export function isLocalDemoMode() {
  return shouldUseLocalDemoMode(process.env.NODE_ENV, process.env.LOCAL_DEMO_MODE);
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, publishableKey };
}
