/**
 * Feature flags. Flip and redeploy to enable.
 */
export const features = {
  /**
   * Google sign-in. Before enabling: turn on the Google provider in
   * Supabase (Authentication → Sign In / Providers) with an OAuth
   * client whose redirect URI is
   * https://<project-ref>.supabase.co/auth/v1/callback
   */
  googleAuth: false,
} as const;
