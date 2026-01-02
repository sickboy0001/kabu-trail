import { createClient } from "@supabase/supabase-js";

export const createKabuTrailAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 管理者用キーを使用
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
