"use server";

import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { Database } from "@/types/supabase";

/**
 * Server Action: feeルールを保存（upsert）します
 * - templateId: fee_templates の id
 * - rules: fee_rules に upsert するオブジェクト配列
 */
export async function saveFeeRules(
  templateId: number,
  rules: Array<Partial<Database["public"]["Tables"]["fee_rules"]["Insert"]>>
) {
  const supabase = await createKabuTrailServerClient();

  // 基本的な検証
  if (!templateId || !Array.isArray(rules)) {
    throw new Error("Invalid parameters: templateId or rules");
  }

  // DBに送るpayloadを整形（id がない場合は新規として扱う）
  const payload = rules.map((r) => {
    const { id, ...rest } = r as any;
    // 型変換と最小検証
    const threshold_amount = Number(rest.threshold_amount ?? 0);
    const fee_rate = Number(rest.fee_rate ?? 0);
    const fixed_fee = Number(rest.fixed_fee ?? 0);
    const is_daily_sum = Boolean(rest.is_daily_sum);

    return {
      threshold_amount,
      fee_rate,
      fixed_fee,
      is_daily_sum,
      template_id: templateId,
    };
  });

  const { data, error } = await supabase.from("fee_rules").upsert(payload);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
