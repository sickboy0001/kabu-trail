"use server";

import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

/**
 * ダッシュボードの設定（レイアウトパターン等）を保存・更新します
 */
export async function saveDashboardSettings(
  patterns: any[],
  activePatternId: string | null,
) {
  const supabase = await createKabuTrailServerClient();

  // 認証ユーザーの取得
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Upsert処理 (user_id が UNIQUE 制約を持っているため、重複時は更新されます)
  const { error } = await supabase.from("account_dashboard_settings").upsert(
    {
      user_id: user.id,
      patterns: patterns,
      active_pattern_id: activePatternId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Failed to save dashboard settings:", error);
    throw new Error("設定の保存に失敗しました");
  }

  // ダッシュボード画面のキャッシュを更新
  revalidatePath("/dashboard");
}

/**
 * ダッシュボードの設定を取得します
 */
export async function getDashboardSettings() {
  const supabase = await createKabuTrailServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("account_dashboard_settings")
    .select("patterns, active_pattern_id")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // データが存在しない場合（初回など）はエラーとせずnullを返す
    return null;
  }

  return data;
}
