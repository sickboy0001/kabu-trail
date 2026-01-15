"use client";

import { useState } from "react";
import { fetchStockDetails, type StockDetails } from "@/lib/stockApi";

export default function StockDetailsTestPage() {
  const [symbol, setSymbol] = useState("7203");
  const [data, setData] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Server Actionを呼び出し
      const result = await fetchStockDetails(symbol);
      if (result) {
        setData(result);
      } else {
        setError("データが取得できませんでした (nullが返されました)");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">fetchStockDetails テスト</h1>

      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-48"
          placeholder="銘柄コード (例: 7203)"
        />
        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "取得中..." : "実行"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-2">
          <h2 className="font-semibold">取得結果:</h2>
          <div className="bg-slate-900 text-slate-50 p-4 rounded overflow-auto max-h-[600px] text-sm font-mono">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mt-8 border-t pt-4">
        <p>※ src/lib/stockApi.ts の fetchStockDetails を呼び出しています。</p>
        <p>
          ※
          サーバーサイド（ターミナル）のログにも詳細が出力される場合があります。
        </p>
      </div>
    </div>
  );
}
