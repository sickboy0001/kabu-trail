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

  // 既存のルールをテンプレート単位で削除してから挿入する
  // ※ 要件によっては soft-delete や差分削除に変更してください
  const { error: delError } = await supabase
    .from("fee_rules")
    .delete()
    .eq("template_id", templateId);

  if (delError) {
    throw new Error("Failed to delete existing rules: " + delError.message);
  }

  const { data, error } = await supabase
    .from("fee_rules")
    .insert(payload)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: 証券会社を作成します
 * - name: 必須
 * - formal_name: オプション
 * - sort_order: 表示順（省略時は 0）
 */
export async function createBroker(
  name: string,
  formal_name?: string,
  sort_order: number = 0
) {
  const supabase = await createKabuTrailServerClient();

  if (!name || typeof name !== "string") {
    throw new Error("Invalid parameter: name");
  }

  const payload = {
    name: name.trim(),
    formal_name: formal_name ?? null,
    sort_order: Number(sort_order) || 0,
  };

  const { data, error } = await supabase
    .from("brokers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: 証券会社の is_active を切り替えます（論理削除）
 * - brokerId: brokers.id
 * - isActive: true=有効, false=無効
 */
export async function setBrokerActive(brokerId: number, isActive: boolean) {
  const supabase = await createKabuTrailServerClient();

  if (!brokerId || typeof brokerId !== "number") {
    throw new Error("Invalid parameter: brokerId");
  }

  // 更新
  const { data, error } = await supabase
    .from("brokers")
    .update({ is_active: isActive })
    .eq("id", brokerId)
    .select()
    .single();

  if (error) {
    // カラムが存在しない等のケースでは具体的な対応手順を返す
    if (error.message && /is_active/.test(error.message)) {
      const migrationSQL = `-- Add is_active column (run in your DB / Supabase SQL editor):\nALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;\nUPDATE public.brokers SET is_active = TRUE WHERE is_active IS NULL;`;
      throw new Error(
        "Failed to update broker is_active. It looks like the 'is_active' column does not exist. Run the following SQL to add it:\n" +
          migrationSQL
      );
    }

    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: brokers の sort_order を更新します
 * - brokerId: brokers.id
 * - sortOrder: integer
 */
export async function updateBrokerSortOrder(
  brokerId: number,
  sortOrder: number
) {
  const supabase = await createKabuTrailServerClient();

  if (!brokerId || typeof brokerId !== "number") {
    throw new Error("Invalid parameter: brokerId");
  }

  if (typeof sortOrder !== "number" || isNaN(sortOrder)) {
    throw new Error("Invalid parameter: sortOrder");
  }

  const { data, error } = await supabase
    .from("brokers")
    .update({ sort_order: sortOrder })
    .eq("id", brokerId)
    .select()
    .single();

  if (error) {
    // カラムが存在しない等のケースでは具体的な対応手順を返す
    if (error.message && /sort_order/.test(error.message)) {
      const migrationSQL = `-- Add sort_order column (run in your DB / Supabase SQL editor):\nALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;\nUPDATE public.brokers SET sort_order = 0 WHERE sort_order IS NULL;`;
      throw new Error(
        "Failed to update broker.sort_order. It looks like the 'sort_order' column does not exist. Run the following SQL to add it:\n" +
          migrationSQL
      );
    }

    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: 証券会社の情報（name, formal_name, sort_order, is_active）を更新します
 */
export async function updateBroker(
  brokerId: number,
  values: {
    name?: string;
    formal_name?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }
) {
  const supabase = await createKabuTrailServerClient();

  if (!brokerId || typeof brokerId !== "number") {
    throw new Error("Invalid parameter: brokerId");
  }

  const payload: any = {};
  if (typeof values.name === "string") payload.name = values.name.trim();
  if ("formal_name" in values) payload.formal_name = values.formal_name ?? null;
  if (typeof values.sort_order === "number")
    payload.sort_order = values.sort_order;
  if ("is_active" in values) payload.is_active = Boolean(values.is_active);

  if (Object.keys(payload).length === 0) {
    throw new Error("No fields to update");
  }

  const { data, error } = await supabase
    .from("brokers")
    .update(payload)
    .eq("id", brokerId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: fee_templates の情報（name, sort_order）を更新します
 */
export async function updateFeeTemplate(
  templateId: number,
  values: { name?: string; sort_order?: number }
) {
  const supabase = await createKabuTrailServerClient();

  if (!templateId || typeof templateId !== "number") {
    throw new Error("Invalid parameter: templateId");
  }

  const payload: any = {};
  if (typeof values.name === "string") payload.name = values.name.trim();
  if (typeof values.sort_order === "number")
    payload.sort_order = values.sort_order;

  if (Object.keys(payload).length === 0) {
    throw new Error("No fields to update");
  }

  const { data, error } = await supabase
    .from("fee_templates")
    .update(payload)
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: 新しい fee_template (パターン) を作成します
 * - brokerId: 所属する brokers.id
 * - name: パターン名（デフォルト: 新規パターン）
 * - sort_order: 表示順（省略時 0）
 */
export async function createFeeTemplate(
  brokerId: number,
  name: string = "新規パターン",
  sort_order: number = 0
) {
  const supabase = await createKabuTrailServerClient();

  if (!brokerId || typeof brokerId !== "number") {
    throw new Error("Invalid parameter: brokerId");
  }

  const payload = {
    broker_id: brokerId,
    name: name.trim() || "新規パターン",
    sort_order: Number(sort_order) || 0,
  };

  const { data, error } = await supabase
    .from("fee_templates")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Server Action: fee_template (パターン) を削除します（関連する fee_rules も削除）
 * - templateId: fee_templates.id
 */
export async function countFeeRules(templateId: number) {
  const supabase = await createKabuTrailServerClient();

  if (!templateId || typeof templateId !== "number") {
    throw new Error("Invalid parameter: templateId");
  }

  // head + count で件数を取得（ボディは不要）
  const { count, error } = await supabase
    .from("fee_rules")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  if (error) {
    throw new Error("Failed to count related rules: " + error.message);
  }

  return Number(count) || 0;
}

export async function deleteFeeTemplate(templateId: number) {
  const supabase = await createKabuTrailServerClient();

  if (!templateId || typeof templateId !== "number") {
    throw new Error("Invalid parameter: templateId");
  }

  // まず関連するルールを削除
  const { error: delRulesError } = await supabase
    .from("fee_rules")
    .delete()
    .eq("template_id", templateId);

  if (delRulesError) {
    throw new Error("Failed to delete related rules: " + delRulesError.message);
  }

  // 次にテンプレート本体を削除
  const { data, error } = await supabase
    .from("fee_templates")
    .delete()
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
