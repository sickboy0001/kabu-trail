import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// 非同期関数(async)に変更します
export const createKabuTrailServerClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 以下の2行を一時的に追加して、ターミナルに値が出るか確認
  console.log("URL Check:", supabaseUrl);
  console.log("Key Check:", supabaseAnonKey ? "Key exists" : "Key is missing");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Key is missing in environment variables");
  }

  // await を追加して cookieStore を取得します
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // サーバーコンポーネント内でのsetエラーは無視して問題ありません
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // 同上
          }
        },
      },
    }
  );
};
