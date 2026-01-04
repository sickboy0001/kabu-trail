import { createClient } from "@supabase/supabase-js";

export const createKabuTrailAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 環境変数チェック（秘密は出力しない）
  if (!url || !serviceKey) {
    console.error("Supabase admin client not configured", {
      urlExists: !!url,
      serviceRoleKeyExists: !!serviceKey,
    });
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set on the server. Please set these environment variables."
    );
  }

  // ログには秘密は出さず、存在のみを報告
  console.log(
    "Supabase admin client: service role key present: yes (length: " +
      serviceKey.length +
      ")"
  );

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
