import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", ctx.user.id)
    .single();

  return {
    ...ctx.user,
    profile,
  };
});
