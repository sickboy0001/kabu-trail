import { supabase } from "@/lib/supabase";

export type StockInfo = {
  code: string;
  name: string;
};

// 半角英数字を全角に変換するヘルパー関数
const toFullWidth = (str: string) => {
  return str.replace(/[A-Za-z0-9]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) + 0xfee0)
  );
};

// 銘柄検索関数（コードまたは名称で検索）
export const searchStocks = async (query: string): Promise<StockInfo[]> => {
  console.log("Searching stocks with query:", query);

  if (!query) return [];

  const fullWidthQuery = toFullWidth(query);
  // 基本の検索条件（コード or 半角名称）
  let orQuery = `code.ilike.%${query}%,name.ilike.%${query}%`;

  // 入力に半角英数字が含まれる場合、全角名称での検索条件も追加（例: "KDDI" -> "ＫＤＤＩ"）
  if (query !== fullWidthQuery) {
    orQuery += `,name.ilike.%${fullWidthQuery}%`;
  }

  // sptStocks.tsを参考に、spt_stocksテーブルから検索
  // コードまたは名称の部分一致検索
  const { data, error } = await supabase
    .from("spt_stocks")
    .select("code, name")
    .or(orQuery)
    .limit(20);

  if (error) {
    console.error("Error searching stocks:", error);
    return [];
  }

  return (data || []).map((item) => ({ code: item.code, name: item.name }));
};

// --- ここから追加 ---

// キャッシュストア（キー: 銘柄コード, 値: { name: string, fetchedAt: number }）
const stockNameCache = new Map<string, { name: string; fetchedAt: number }>();
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10分

/**
 * 複数の銘柄コードから銘柄情報を取得します。
 * Supabaseへの負荷を軽減するため、取得結果は10分間キャッシュされます。
 * @param codes - 銘柄コードの配列
 * @returns 銘柄情報({code, name})の配列。元の配列と同じ順序で返却されます。
 */
export const getStockNamesByCodes = async (
  codes: string[]
): Promise<StockInfo[]> => {
  const now = Date.now();
  const uniqueCodes = [...new Set(codes)]; // 重複を除外してAPIコールを効率化
  const resultsFromCache: StockInfo[] = [];
  const codesToFetch: string[] = [];

  // 1. キャッシュをチェックし、有効なデータとDBから取得が必要なコードを分離
  for (const code of uniqueCodes) {
    const cached = stockNameCache.get(code);
    if (cached && now - cached.fetchedAt < CACHE_DURATION_MS) {
      resultsFromCache.push({ code, name: cached.name });
    } else {
      codesToFetch.push(code);
    }
  }

  let resultsFromDb: StockInfo[] = [];
  // 2. DBから取得が必要な銘柄があれば取得
  if (codesToFetch.length > 0) {
    const { data, error } = await supabase
      .from("spt_stocks")
      .select("code, name")
      .in("code", codesToFetch);

    if (error) {
      console.error("Error fetching stock names by codes:", error);
      // エラーの場合はDBからの取得は諦めますが、処理は続行しキャッシュ済みの結果を返します。
    } else if (data) {
      resultsFromDb = data.map((stock) => ({
        code: stock.code,
        name: stock.name,
      }));
      // 3. 取得したデータをキャッシュに保存
      resultsFromDb.forEach((stock) => {
        stockNameCache.set(stock.code, { name: stock.name, fetchedAt: now });
      });
    }
  }

  // 4. キャッシュとDBの結果をマージし、元の順序で返却
  const allResultsMap = new Map(
    [...resultsFromCache, ...resultsFromDb].map((item) => [
      item.code,
      item.name,
    ])
  );

  return codes.map((code) => ({
    code,
    name: allResultsMap.get(code) || "", // 見つからない銘柄はnameを空文字にする
  }));
};
