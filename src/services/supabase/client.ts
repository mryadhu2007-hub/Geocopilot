/**
 * ============================================================================
 * SUPABASE CLIENT INTEGRATION BOUNDARY
 * ============================================================================
 * RESPONSIBLE: Member 4 (Backend, Supabase, PostGIS & GIS Analysis)
 *
 * HOW TO INTEGRATE:
 * 1. Install Supabase client library:
 *    `npm install @supabase/supabase-js`
 *
 * 2. Set environment variables in your `.env.local` file:
 *    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * 3. Replace the stub below with:
 *    ```ts
 *    import { createClient } from "@supabase/supabase-js";
 *
 *    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
 *    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
 *
 *    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
 *    ```
 *
 * NOTE: Do not hardcode credentials here or commit real keys to version control.
 * ============================================================================
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
}

/**
 * Utility helper to check if Supabase environment variables are present
 * without throwing errors or exposing sensitive values.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    isConfigured: hasUrl && hasKey,
    hasUrl,
    hasKey,
  };
}

/**
 * Placeholder client reference until `@supabase/supabase-js` is installed by Member 4.
 */
export const supabasePlaceholder = {
  status: "uninitialized" as const,
  message: "Supabase client will be initialized by Member 4 once dependencies and PostGIS schema are set.",
};
