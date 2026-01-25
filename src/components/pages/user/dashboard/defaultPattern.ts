import type { DashboardPattern } from "./DashboardClient";

// --- デフォルトのJSON構造（初期表示用） ---
export const DEFAULT_PATTERN: DashboardPattern = {
  id: "pattern_standard",
  name: "標準レイアウト",
  is_default: true,
  columns: 6,
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
      id: "w2",
      type: "profit_loss_summary",
      title: "評価損益合計",
      cols: 2,
      order: 2,
      settings: {},
    },
    {
      id: "w3",
      type: "day_over_day",
      title: "前日比",
      cols: 2,
      order: 3,
      settings: {},
    },
    {
      id: "w4",
      type: "asset_history",
      title: "資産推移（1年）",
      cols: 4,
      order: 4,
      settings: { period: "1y" },
    },
    {
      id: "w5",
      type: "holdings_pie",
      title: "ポートフォリオ",
      cols: 2,
      order: 5,
      settings: {},
    },
    {
      id: "w6",
      type: "holdings_list",
      title: "保有銘柄一覧",
      cols: 6,
      order: 6,
      settings: {},
    },
  ],
};
