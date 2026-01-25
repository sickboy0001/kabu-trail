"use client";

import React, { useState, useEffect } from "react";
import DashboardSettingClient from "./setting/DashboardSettings";
import { User } from "@supabase/supabase-js";
import { PlaceholderWidget } from "./PlaceholderWidget";
import { useHoldingsData } from "@/hooks/useHoldingsData";
import { useTransactionData } from "@/hooks/useTransactionData";
import { getDashboardSettings } from "@/app/actions/user/dashboardsetting";
import Toast from "@/components/ui/Toast";
import { DEFAULT_PATTERN } from "./defaultPattern";

// --- 型定義 ---
export type WidgetSettings = {
  period?: string;
  base_date_type?: string;
  bucket_id?: string | null;
  [key: string]: any;
};

export type Widget = {
  id: string;
  type: string;
  title: string;
  cols: number; // 1 ~ 6
  order: number;
  settings: WidgetSettings;
};

export type DashboardPattern = {
  id: string;
  name: string;
  is_default: boolean;
  columns: number;
  widgets: Widget[];
};

const INITIAL_PATTERNS = [DEFAULT_PATTERN].map((p) => ({
  ...p,
  id: String(p.id),
}));

type Props = {
  user: User;
};

// --- メインコンポーネント ---
const DashboardClient = ({ user }: Props) => {
  // 実際には Supabase から取得するが、一旦定数を使用
  const [patterns, setPatterns] =
    useState<DashboardPattern[]>(INITIAL_PATTERNS);

  // 初期表示時にDBから設定をロード
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getDashboardSettings();
        if (
          settings &&
          settings.patterns &&
          Array.isArray(settings.patterns) &&
          settings.patterns.length > 0
        ) {
          // IDが数値で返ってくる場合があるため、文字列に変換して安全にする
          const loadedPatterns = settings.patterns.map((p: any) => ({
            ...p,
            id: String(p.id),
          })) as DashboardPattern[];
          setPatterns(loadedPatterns);
          setJsonInput(JSON.stringify(loadedPatterns, null, 2)); // JSONエディタ用も更新

          if (settings.active_pattern_id) {
            setCurrentPatternId(String(settings.active_pattern_id));
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard settings:", error);
      }
    };
    loadSettings();
  }, []);

  // 保有銘柄データの取得
  const { positions, closedTrades } = useHoldingsData(user.id);

  // 資産推移データの取得
  const { transactions } = useTransactionData(user.id);

  const initialPatternId =
    INITIAL_PATTERNS.find((p) => p.is_default)?.id || INITIAL_PATTERNS[0].id;
  const [currentPatternId, setCurrentPatternId] =
    useState<string>(initialPatternId);

  const currentPattern =
    patterns.find((p) => p.id === currentPatternId) || patterns[0];

  // JSON編集用のState
  const [jsonInput, setJsonInput] = useState(JSON.stringify(patterns, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info",
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("配列形式で入力してください");
      }
      setPatterns(parsed);

      // 現在選択中のIDが存在するか確認し、なければ先頭を選択
      if (
        !parsed.find((p: DashboardPattern) => p.id === currentPatternId) &&
        parsed.length > 0
      ) {
        setCurrentPatternId(parsed[0].id);
      }

      setError(null);
    } catch (e) {
      setError("JSONパースエラー: 正しいJSON形式（配列）で入力してください");
    }
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPatternId(e.target.value);
  };

  // 列数に応じたクラス名を決定するヘルパー
  const getGridClass = (cols: number) => {
    switch (cols) {
      case 1:
        return "md:grid-cols-1";
      case 2:
        return "md:grid-cols-2";
      case 3:
        return "md:grid-cols-3";
      case 4:
        return "md:grid-cols-4";
      case 5:
        return "md:grid-cols-5";
      default:
        return "md:grid-cols-6";
    }
  };

  // 設定画面からの保存処理
  const handleSaveSettings = (newPatterns: DashboardPattern[]) => {
    setPatterns(newPatterns);
    setJsonInput(JSON.stringify(newPatterns, null, 2)); // JSONエディタ側も同期

    // 現在選択中のIDが削除されていた場合、先頭を選択する
    if (
      !newPatterns.find((p) => p.id === currentPatternId) &&
      newPatterns.length > 0
    ) {
      setCurrentPatternId(newPatterns[0].id);
    }
    setIsSettingMode(false);
    showToast("設定を保存しました", "success");
  };

  const mainContent = (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* JSON編集エリア */}
      {showJsonEditor && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            レイアウトJSON編集
          </label>
          <textarea
            className="w-full h-40 p-2 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleApplyJson}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors"
            >
              JSONを適用して更新
            </button>
            {error && <span className="text-red-500 text-sm">{error}</span>}
          </div>
        </div>
      )}

      {/* ヘッダーエリア */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:gap-0">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentPattern.name}
            </h1>
            <select
              value={currentPattern.id}
              onChange={handlePatternChange}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {patterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ダッシュボードの概要を表示しています
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className={`px-4 py-2 border rounded shadow-sm transition-colors ${showDebugInfo ? "bg-yellow-100 border-yellow-300 text-yellow-800" : "bg-white hover:bg-gray-50"}`}
          >
            🐞 デバッグ
          </button>
          <button
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50"
          >
            📝 JSON編集
          </button>
          <button className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50">
            🔄 更新
          </button>
          <button
            onClick={() => setIsSettingMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
          >
            ⚙️ 設定
          </button>
        </div>
      </div>

      {/* グリッドレイアウトエリア */}
      {/* md:grid-cols-6 でPC版は6列。 
          gap-4 でウィジェット間の隙間を確保。
      */}
      <div
        className={`grid grid-cols-1 gap-4 ${getGridClass(currentPattern.columns || 6)}`}
      >
        {currentPattern.widgets
          .sort((a, b) => a.order - b.order)
          .map((widget) => (
            <div
              key={widget.id}
              style={{
                // Tailwindの動的な col-span はパージされる可能性があるため、style or 固定クラスを使用
                gridColumn: `span ${widget.cols} / span ${widget.cols}`,
              }}
              className="w-full"
            >
              <PlaceholderWidget
                widget={widget}
                showDebugInfo={showDebugInfo}
                positions={positions}
                closedTrades={closedTrades}
                transactions={transactions}
              />
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <>
      {isSettingMode ? (
        <DashboardSettingClient
          initialPatterns={patterns}
          currentPatternId={currentPatternId}
          onSave={handleSaveSettings}
          onCancel={() => setIsSettingMode(false)}
          transactions={transactions}
          positions={positions}
          showToast={showToast}
        />
      ) : (
        mainContent
      )}
      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
};

export default DashboardClient;
