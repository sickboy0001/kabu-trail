import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 汎用的なSupabaseクライアント（主にクライアントサイドで使用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 型安全なDB操作をしたい場合は、後ほど作成するDatabase型を
 * createClient<Database>(...) のように適用します。
 */
