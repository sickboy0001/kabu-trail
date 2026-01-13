"use server";

import { createClient } from "@/lib/supabase/client";

export type JpxImportRow = {
  date: string;
  code: string;
  name: string;
  market: string;
  industry33Code: string;
  industry33Name: string;
  industry17Code: string;
  industry17Name: string;
  scaleCode: string;
  scaleName: string;
};

export type ImportResult = {
  success: boolean;
  count: number;
  message: string;
  errors?: string[];
};

export async function importJpxStocks(
  rows: JpxImportRow[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let successCount = 0;

  try {
    // 1. jpx_company_master 向けのデータ変換
    const jpxMasterData = rows.map((row) => ({
      code: row.code,
      company_name: row.name,
      market_segment: row.market,
      industry_33_code: row.industry33Code === "-" ? null : row.industry33Code,
      industry_33_name: row.industry33Name === "-" ? null : row.industry33Name,
      industry_17_code: row.industry17Code === "-" ? null : row.industry17Code,
      industry_17_name: row.industry17Name === "-" ? null : row.industry17Name,
      scale_code: row.scaleCode === "-" ? null : row.scaleCode,
      scale_name: row.scaleName === "-" ? null : row.scaleName,
      updated_at: new Date().toISOString(),
    }));

    // 2. spt_stocks 向けのデータ変換
    // アプリケーションで主に使うマスタ。JPXデータから必要な情報を抽出して更新
    const sptStocksData = rows.map((row) => ({
      code: row.code,
      name: row.name,
      market: row.market,
      industry: row.industry33Name !== "-" ? row.industry33Name : null,
      tradable: true, // 上場一覧にあるものは取引可能とみなす
      updated_at: new Date().toISOString(),
    }));

    // 3. バッチ処理でUpsert
    // データ量が多い場合（4000件超）、分割処理が必要になる可能性がありますが、
    // ここではシンプルに一括処理として記述します。

    // jpx_company_master 更新
    const { error: jpxError } = await supabase
      .from("jpx_company_master")
      .upsert(jpxMasterData, { onConflict: "code" });

    if (jpxError) {
      console.error("JPX Master Upsert Error:", jpxError);
      throw new Error(`JPXマスタの更新に失敗しました: ${jpxError.message}`);
    }

    // spt_stocks 更新
    // 既存の created_at などを保持するため、onConflict で update するカラムを指定しても良いですが、
    // ここでは全カラム更新（created_atはDB側デフォルト維持）とします。
    const { error: sptError } = await supabase
      .from("spt_stocks")
      .upsert(sptStocksData, { onConflict: "code" });

    if (sptError) {
      console.error("SPT Stocks Upsert Error:", sptError);
      throw new Error(`銘柄マスタの更新に失敗しました: ${sptError.message}`);
    }

    successCount = rows.length;

    return {
      success: true,
      count: successCount,
      message: "インポートが完了しました。",
    };
  } catch (error: any) {
    console.error("Import Error:", error);
    return {
      success: false,
      count: 0,
      message: error.message || "予期せぬエラーが発生しました。",
      errors: [error.message],
    };
  }
}
