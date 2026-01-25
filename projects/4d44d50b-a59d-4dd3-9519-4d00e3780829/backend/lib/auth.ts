import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getAuth(authHeader: string) {
  try {
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("[Auth] Error:", error);
    return null;
  }
}
