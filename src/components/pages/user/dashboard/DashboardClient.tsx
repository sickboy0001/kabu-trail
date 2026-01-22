"use client";

import React, { useState } from "react";
import DashboardSettingClient from "./setting/DashboardSettings";
import { User } from "@supabase/supabase-js";

// --- 型定義 ---
type WidgetSettings = {
  period?: string;
  base_date_type?: string;
  bucket_id?: string | null;
  [key: string]: any;
};

type Widget = {
  id: string;
  type: string;
  title: string;
  cols: number; // 1 ~ 6
  order: number;
  settings: WidgetSettings;
};

type DashboardPattern = {
  id: string;
  name: string;
  is_default: boolean;
  columns: number;
  widgets: Widget[];
};

// --- デフォルトのJSON構造（初期表示用） ---
const DEFAULT_PATTERN: DashboardPattern = {
  id: "pattern_standard",
  name: "標準レイアウト",
  is_default: true,
  columns: 3,
  widgets: [
    {
      id: "w1",
      type: "asset_summary",
      title: "資産情報",
      cols: 1,
      order: 1,
      settings: {},
    },
    {
      id: "w2",
      type: "profit_loss_summary",
      title: "評価損益合計",
      cols: 1,
      order: 2,
      settings: {},
    },
    {
      id: "w3",
      type: "day_over_day",
      title: "前日比",
      cols: 1,
      order: 3,
      settings: {},
    },
    {
      id: "w4",
      type: "asset_history",
      title: "資産推移（1年）",
      cols: 3,
      order: 4,
      settings: { period: "1y" },
    },
    {
      id: "w5",
      type: "portfolio_pie",
      title: "ポートフォリオ",
      cols: 2,
      order: 5,
      settings: {},
    },
    {
      id: "w6",
      type: "stock_list",
      title: "保有銘柄一覧",
      cols: 4,
      order: 6,
      settings: {},
    },
  ],
};

const PATTERN_SIMPLE: DashboardPattern = {
  id: "pattern_simple",
  name: "シンプルレイアウト",
  is_default: false,
  columns: 2,
  widgets: [
    {
      id: "w1",
      type: "asset_summary",
      title: "資産情報",
      cols: 2,
      order: 1,
      settings: {},
    },
    {
      id: "w4",
      type: "asset_history",
      title: "資産推移（1年）",
      cols: 2,
      order: 2,
      settings: { period: "1y" },
    },
  ],
};

const INITIAL_PATTERNS = [DEFAULT_PATTERN, PATTERN_SIMPLE];

// --- 仮のウィジェットコンポーネント ---
const PlaceholderWidget = ({ widget }: { widget: Widget }) => (
  <div className="h-full min-h-40 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
    <h3 className="text-sm font-bold text-gray-500 mb-2 border-b pb-1">
      {widget.title}
    </h3>
    <div className="grow flex items-center justify-center text-gray-400 italic">
      {widget.type} (cols: {widget.cols})
    </div>
  </div>
);

type Props = {
  user: User;
};

// --- メインコンポーネント ---
const DashboardClient = ({ user }: Props) => {
  // 実際には Supabase から取得するが、一旦定数を使用
  const [patterns, setPatterns] =
    useState<DashboardPattern[]>(INITIAL_PATTERNS);

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
  };

  if (isSettingMode) {
    return (
      <DashboardSettingClient
        initialPatterns={patterns}
        currentPatternId={currentPatternId}
        onSave={handleSaveSettings}
        onCancel={() => setIsSettingMode(false)}
      />
    );
  }

  return (
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
      <div className="flex justify-between items-center mb-8">
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
        <div className="flex gap-2">
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
              <PlaceholderWidget widget={widget} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default DashboardClient;
