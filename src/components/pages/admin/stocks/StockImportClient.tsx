"use client";

import { useState } from "react";
import {
  importJpxStocks,
  type JpxImportRow,
} from "@/app/actions/admin/stockImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";

export default function StockImportClient() {
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState<JpxImportRow[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // TSVパース処理
  const handleParse = () => {
    if (!rawText.trim()) return;

    try {
      const rows = rawText.trim().split("\n");
      const data: JpxImportRow[] = [];

      // ヘッダー行が含まれているか簡易チェック（"コード"という文字があればスキップなど）
      // ここでは単純にすべての行を処理し、数値4桁+文字のコードパターンでフィルタリングする例とします

      rows.forEach((row) => {
        const cols = row.split("\t");
        // JPXのエクセル形式: 日付, コード, 銘柄名, 市場...
        // 最低限必要なカラム数があるかチェック
        if (cols.length < 3) return;

        const code = cols[1]?.trim();
        // コードが空、またはヘッダー行っぽい場合はスキップ
        if (!code || code === "コード") return;

        data.push({
          date: cols[0]?.trim(),
          code: code,
          name: cols[2]?.trim(),
          market: cols[3]?.trim(),
          industry33Code: cols[4]?.trim(),
          industry33Name: cols[5]?.trim(),
          industry17Code: cols[6]?.trim(),
          industry17Name: cols[7]?.trim(),
          scaleCode: cols[8]?.trim(),
          scaleName: cols[9]?.trim(),
        });
      });

      setParsedData(data);
      setIsPreviewing(true);
      setResult(null);
    } catch (e) {
      alert("パースに失敗しました。データ形式を確認してください。");
    }
  };

  // インポート実行
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      // Server Actionsの1MB制限を回避するために分割送信する
      const CHUNK_SIZE = 500;
      let successCount = 0;

      for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
        const chunk = parsedData.slice(i, i + CHUNK_SIZE);
        const res = await importJpxStocks(chunk);

        if (!res.success) {
          throw new Error(res.message);
        }
        successCount += res.count;
      }

      setResult({
        success: true,
        message: `${successCount}件のデータの取り込みに成功しました。`,
      });

      setRawText("");
      setParsedData([]);
      setIsPreviewing(false);
    } catch (e: any) {
      setResult({
        success: false,
        message: e.message || "通信エラーが発生しました。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            JPXデータ取り込み
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600 space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a
                  href="https://www.jpx.co.jp/markets/statistics-equities/misc/01.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  日本取引所グループ公式サイト
                </a>
                から「東証上場銘柄一覧」のExcelをダウンロードします。
              </li>
              <li>
                Excelを開き、データが含まれるシートの全列（A列〜J列など）を選択してコピーします。
              </li>
              <li>
                以下のテキストエリアに貼り付け、「内容を確認」ボタンを押してください。
              </li>
            </ol>
            <p className="text-xs text-slate-400 pl-4">
              ※ 日付、コード、銘柄名、市場・商品区分...
              の順序（TSV形式）を想定しています。
            </p>
          </div>

          <Textarea
            placeholder="ここにExcelの内容を貼り付け..."
            className="min-h-50 font-mono text-xs"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="flex gap-4">
            <Button
              onClick={handleParse}
              disabled={!rawText || isSubmitting}
              variant="secondary"
            >
              内容を確認（プレビュー）
            </Button>
            {isPreviewing && (
              <Button
                onClick={handleImport}
                disabled={isSubmitting || parsedData.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {parsedData.length}件をインポート実行
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "完了" : "エラー"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {isPreviewing && parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">プレビュー（上位5件）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-2">コード</th>
                    <th className="p-2">銘柄名</th>
                    <th className="p-2">市場</th>
                    <th className="p-2">業種</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 font-mono">{row.code}</td>
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.market}</td>
                      <td className="p-2">{row.industry33Name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ...他 {parsedData.length - 5} 件
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
