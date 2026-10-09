export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const appName = process.env.APP_NAME ?? "DentalCare";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const emailConfigured = Boolean(process.env.RESEND_API_KEY);
