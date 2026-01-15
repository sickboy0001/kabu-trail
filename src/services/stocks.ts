import { supabase } from "@/lib/supabase";

export type StockInfo = {
  code: string;
  name: string;
};

export type StockJpxInfo = {
  code: string;
  company_name: string;
  market_segment: string;
  industry_33_code: string | null;
  industry_33_name: string | null;
  industry_17_code: string | null;
  industry_17_name: string | null;
  scale_code: string | null;
  scale_name: string | null;
  updated_at: string;
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

export const getStockInfoJpxMaster = async (
  codes: string[]
): Promise<StockJpxInfo[]> => {
  if (codes.length === 0) return [];

  const { data, error } = await supabase
    .from("jpx_company_master")
    .select("*")
    .in("code", codes);

  if (error) {
    console.error("Error fetching JPX stock info:", error);
    return [];
  }

  return data as StockJpxInfo[];
};

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

/**
 * 銘柄参照履歴を記録します。
 * @param userId - ユーザーID
 * @param stockCode - 銘柄コード
 */
export const recordStockViewHistory = async (
  userId: string,
  stockCode: string
) => {
  const { error } = await supabase
    .from("spt_stock_view_history")
    .insert({ user_id: userId, stock_code: stockCode });

  if (error) {
    console.error("Error recording stock view history:", error);
  }
};

/**
 * ユーザーの最近の銘柄参照履歴を取得します。
 * @param userId - ユーザーID
 * @param limit - 取得件数（デフォルト5件）
 * @returns 銘柄情報の配列
 */
export const getRecentStockViews = async (
  userId: string,
  limit: number = 5
): Promise<StockInfo[]> => {
  const { data, error } = await supabase
    .from("spt_stock_view_history")
    .select("stock_code, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(50); // 重複除去のため多めに取得

  if (error) {
    console.error("Error fetching stock view history:", error);
    return [];
  }

  // 重複を除去してコードのリストを作成
  const uniqueCodes = Array.from(
    new Set(data.map((item) => item.stock_code))
  ).slice(0, limit);

  // 銘柄情報を取得して返却
  return getStockNamesByCodes(uniqueCodes);
};

/**
 * 指定した銘柄が含まれているユーザーのバスケットを取得します。
 * @param userId - ユーザーID
 * @param stockCode - 銘柄コード
 * @returns バスケット情報の配列
 */
export const getBasketsContainingStock = async (
  userId: string,
  stockCode: string
): Promise<{ id: number; name: string }[]> => {
  // 複雑なJOINクエリを避け、2段階で取得することでエラーを回避します

  // 1. まず、その銘柄を含んでいる basket_item を検索
  const { data: items, error: itemsError } = await supabase
    .from("stock_basket_items")
    .select("stock_basket_id")
    .eq("stock_code", stockCode);

  if (itemsError) {
    console.error("Error fetching basket items for stock:", itemsError);
    return [];
  }

  if (!items || items.length === 0) {
    return [];
  }

  // 重複を除去
  const basketIds = Array.from(
    new Set(items.map((item) => item.stock_basket_id))
  );

  // 2. それらの basket_id のうち、指定ユーザーが所有するものを取得
  const { data: baskets, error: basketsError } = await supabase
    .from("stock_baskets")
    .select("id, name")
    .in("id", basketIds)
    .eq("user_id", userId);

  if (basketsError) {
    console.error("Error fetching user baskets for stock:", basketsError);
    return [];
  }

  return baskets || [];
};

/**
 * 観察ログを追加します。
 * @param userId - ユーザーID
 * @param stockCode - 銘柄コード
 * @param comment - コメント
 */
export const addObservationLog = async (
  userId: string,
  stockCode: string,
  comment: string
) => {
  const { error } = await supabase.from("observation_logs").insert({
    user_id: userId,
    date: new Date().toISOString(),
    content: comment,
    stocks: [stockCode],
    tags: [],
    is_active: true,
  });

  if (error) {
    throw error;
  }
};

export type StockObservationLog = {
  id: number;
  date: string;
  content: string;
  stocks: string[];
};

export const getStockObservationLogs = async (
  userId: string,
  stockCode: string
): Promise<StockObservationLog[]> => {
  const { data, error } = await supabase
    .from("observation_logs")
    .select("id, date, content, stocks")
    .eq("user_id", userId)
    .contains("stocks", [stockCode])
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching stock observation logs:", error);
    return [];
  }
  return data as StockObservationLog[];
};
