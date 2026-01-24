"use client";

import { useRef, useState, useMemo } from "react";
import { BrokerAccount } from "@/services/account";
import {
  Upload,
  FileText,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { NomuraCsvGuide } from "./NomuraCsvGuide";
import { GmoCsvGuide } from "./GmoCsvGuide";

type Props = {
  accounts: BrokerAccount[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
  initialAccountId: string;
};

export default function StepUpload({
  accounts,
  selectedAccountId,
  onAccountChange,
  file,
  onFileChange,
  onNext,
  initialAccountId,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(
    (a) => String(a.id) === selectedAccountId,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".csv")
      ) {
        onFileChange(droppedFile);
      } else {
        toast.error("CSVファイルのみアップロード可能です");
      }
    }
  };

  const handlePreview = () => {
    if (!selectedAccountId) {
      toast.error("インポート先の口座を選択してください");
      return;
    }
    if (!file) {
      toast.error("ファイルを選択してください");
      return;
    }
    onNext();
  };

  const guideInfo = useMemo(() => {
    const brokerName = selectedAccount?.brokerName || "";
    const accountName = selectedAccount?.name || "";
    if (brokerName.includes("GMO") || accountName.includes("GMO")) {
      return { name: "GMOクリック証券", Component: GmoCsvGuide };
    }
    return { name: "野村證券", Component: NomuraCsvGuide };
  }, [selectedAccount]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">インポート設定</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            インポート先の口座
          </label>
          {initialAccountId ? (
            <div className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-slate-700">
              {selectedAccount ? (
                <>
                  <span className="font-semibold">{selectedAccount.name}</span>
                  <span className="text-sm text-slate-500 ml-2">
                    ({selectedAccount.brokerName || "証券会社不明"})
                  </span>
                </>
              ) : (
                <span className="text-slate-400">読み込み中...</span>
              )}
            </div>
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => onAccountChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">口座を選択してください</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.brokerName || "証券会社不明"})
                </option>
              ))}
            </select>
          )}
          {selectedAccount && (
            <p className="text-xs text-slate-500 mt-2">
              ※ {selectedAccount.brokerName}{" "}
              のCSVフォーマットに対応しています（仮）
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CSVファイル
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center text-blue-600">
                <FileText size={48} className="mb-2" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileChange(null);
                  }}
                  className="mt-4 text-sm text-red-500 hover:underline"
                >
                  ファイルを削除
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Upload size={48} className="mb-2 text-slate-400" />
                <p className="font-medium text-slate-700">
                  クリックしてファイルを選択
                </p>
                <p className="text-sm mt-1">またはここにファイルをドロップ</p>
                <p className="text-xs text-slate-400 mt-4">対応形式: CSV</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-bold mb-1">インポート時の注意点</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>
                証券会社からダウンロードしたCSVをそのままアップロードしてください。
              </li>
              <li>重複する取引データは自動的にスキップされます（予定）。</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            <HelpCircle size={16} />
            {showGuide
              ? "CSV入手方法を閉じる"
              : `${guideInfo.name}のCSV入手方法を確認する`}
          </button>
          {showGuide && <guideInfo.Component />}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePreview}
          disabled={!file || !selectedAccountId}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          内容を確認する
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
