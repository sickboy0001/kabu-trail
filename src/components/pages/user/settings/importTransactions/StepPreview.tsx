"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { AlertTriangle, CopyX, RefreshCw } from "lucide-react";

type Props = {
  file: File | null;
  onBack: () => void;
  onImport: (data: ParsedTransaction[], method: "overwrite" | "skip") => void;
};

export type ParsedTransaction = {
  date: string;
  type: string;
  depositType: string;
  name: string;
  code: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  fee: string;
  memo: string;
};

export default function StepPreview({ file, onBack, onImport }: Props) {
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<"overwrite" | "skip">(
    "skip",
  );

  useEffect(() => {
    if (!file) return;

    setIsLoading(true);
    Papa.parse(file, {
      header: false, // ヘッダー位置を動的に探すためfalse
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as string[][];

          // ヘッダー行を探す
          // "約定日" と "受渡日" が含まれている行をヘッダーとみなす
          const headerIndex = rows.findIndex(
            (row) =>
              row.some((cell) => cell.includes("約定日")) &&
              row.some((cell) => cell.includes("受渡日")),
          );

          if (headerIndex === -1) {
            toast.error("CSVフォーマットを認識できませんでした");
            setIsLoading(false);
            return;
          }

          const header = rows[headerIndex];
          // カラム名のマッピング（CSVのヘッダー名 -> インデックス）
          const getColIndex = (name: string) =>
            header.findIndex((h) => h.includes(name));

          const colMap = {
            date: getColIndex("約定日"),
            name: getColIndex("銘柄名"),
            code: getColIndex("銘柄コード"),
            type: getColIndex("取引区分"),
            depositType: getColIndex("預り区分"),
            quantity: getColIndex("数量"),
            unitPrice: getColIndex("単価"),
            amount: getColIndex("受渡金額/決済損益"),
            fee: getColIndex("手数料"), // "手数料（税込）"の部分一致
            memo: getColIndex("摘要"),
          };

          const dataRows = rows.slice(headerIndex + 1);
          const transactions: ParsedTransaction[] = dataRows
            .filter((row) => row.length > 1 && row[colMap.date]) // 空行などを除外
            .map((row) => ({
              date: row[colMap.date] || "",
              type: row[colMap.type] || "",
              depositType: row[colMap.depositType] || "",
              name: row[colMap.name] || "",
              code: row[colMap.code] || "",
              quantity: row[colMap.quantity] || "",
              unitPrice: row[colMap.unitPrice] || "",
              amount: row[colMap.amount] || "",
              fee: row[colMap.fee] || "",
              memo: row[colMap.memo] || "",
            }));

          setParsedData(transactions);
        } catch (error) {
          console.error(error);
          toast.error("CSVの解析中にエラーが発生しました");
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error(error);
        toast.error("ファイルの読み込みに失敗しました");
        setIsLoading(false);
      },
    });
  }, [file]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">インポート内容の確認</h2>
          <div className="text-sm text-slate-500">
            対象ファイル: {file?.name}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">読み込み中...</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg border-slate-200 mb-6 max-h-[60vh]">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-medium text-slate-600">日付</th>
                  <th className="p-4 font-medium text-slate-600">口座/区分</th>
                  <th className="p-4 font-medium text-slate-600">銘柄/摘要</th>
                  <th className="p-4 font-medium text-slate-600 text-right">
                    数量
                  </th>
                  <th className="p-4 font-medium text-slate-600 text-right">
                    単価/金額
                  </th>
                  <th className="p-4 font-medium text-slate-600 text-right">
                    手数料
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      データが見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  parsedData.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-700">{item.date}</td>
                      <td className="p-4 text-slate-700">
                        <div>{item.type}</div>
                        {item.depositType && (
                          <div className="text-xs text-slate-500">
                            {item.depositType}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800 font-medium">
                          {item.name || item.memo}
                        </div>
                        {item.code && (
                          <div className="text-xs text-slate-500">
                            {item.code}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-700">
                        {item.quantity
                          ? Number(item.quantity).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-slate-800">
                          {item.amount
                            ? `${Number(item.amount).toLocaleString()}円`
                            : "-"}
                        </div>
                        {item.unitPrice && (
                          <div className="text-xs text-slate-500">
                            @{Number(item.unitPrice).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-700">
                        {item.fee
                          ? `${Number(item.fee).toLocaleString()}円`
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-medium text-slate-800 mb-3">
            登録済みデータの扱い
          </h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="radio"
                name="importMethod"
                value="skip"
                checked={importMethod === "skip"}
                onChange={() => setImportMethod("skip")}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <CopyX size={18} className="text-slate-500" />
                  重複データをスキップ（推奨）
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  同じ日付・銘柄・金額のデータが既に存在する場合、そのデータは登録しません。
                  新規データのみを追加します。
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
              <input
                type="radio"
                name="importMethod"
                value="overwrite"
                checked={importMethod === "overwrite"}
                onChange={() => setImportMethod("overwrite")}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <div>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <RefreshCw size={18} className="text-red-500" />
                  期間内のデータを置き換え（洗い替え）
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  CSVに含まれる期間（開始日〜終了日）の既存データをすべて削除してから、
                  今回のデータを登録します。重複して登録されてしまった場合の修正に便利です。
                </p>
                {importMethod === "overwrite" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    <AlertTriangle size={14} />
                    <span>
                      注意:
                      対象期間の手動入力データも削除される可能性があります。
                    </span>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
          >
            戻る
          </button>
          <button
            onClick={() => onImport(parsedData, importMethod)}
            disabled={parsedData.length === 0 || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            インポートを実行
          </button>
        </div>
      </div>
    </div>
  );
}
