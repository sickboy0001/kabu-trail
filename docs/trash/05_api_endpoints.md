## 1. ユーザーメニュー（User Components）

個人の資産状況や取引を管理するためのメインコンポーネントです。

| 元の機能名 | コンポーネント名案 | 役割・ファイルパス案 |
| --- | --- | --- |
| **ダッシュボード** | `DashboardSummary` | `/dashboard/page.tsx` 全資産の概況 |
| **取引登録** | `TradeEntryForm` | `/trades/new/` 入力専用ならForm、編集込ならEditor |
| **月間・年間成績** | `PerformanceAnalytics` | `/analytics/` 期間別の勝率やPF分析 |
| **損益推移** | `ProfitLossChart` | `/charts/pl/` 資産曲線の可視化 |
| **カレンダー** | `DividendCalendar` | `/calendar/` 権利確定日や配当予定の可視化 |
| **信用維持率** | `MarginStatusCard` | 信用取引の余力や警告（アラート用） |
| **返済期限** | `RepaymentTracker` | 信用期日までのカウントダウン表示 |
| **取引履歴** | `TradeHistoryTable` | `/trades/history/` フィルタ・検索可能な一覧 |
| **入出金記録** | `CashFlowLedger` | `/cashflow/` 証券口座への入出金履歴 |
| **利用口座** | `BrokerAccountManager` | `/settings/accounts/` 口座情報の登録・編集 |
