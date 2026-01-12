
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

---

## 2. 管理者メニュー（Admin Components）

システムの基礎データ（マスタ）を設定するためのコンポーネントです。

* **証券会社マスタ:** `BrokerMasterList`
* 野村、松井、楽天などの証券会社名とロゴなどを管理。


* **手数料プラン設定:** `FeePlanEditor`
* 「1日定額制」「1取引ごと」などの計算ロジックを管理。


* **税率設定:** `TaxConfig`
* 分離課税の税率（20.315%など）を管理。


* **計算エンジン:** `FeeCalculatorEngine` (※UIではなくロジック)
* 取引金額を入力すると、設定されたマスタから自動で手数料を算出する関数。




---

## 3. 推奨されるディレクトリ構成案

Next.jsのApp Routerで作成する場合、以下のような構成にすると管理が非常に楽になります。

```text
src/
 ├── app/ (ルーティング)
 │    ├── (auth)/        # ログイン・サインイン関連
 │    ├── (user)/        # ユーザー用メニュー
 │    │    ├── dashboard/
 │    │    ├── trades/
 │    │    └── accounts/
 │    └── admin/         # 管理者用メニュー
 ├── components/ (共通UI)
 │    ├── ui/            # ボタンやテーブルなどの基本パーツ
 │    ├── charts/        # グラフ専用コンポーネント
 │    └── forms/         # 入力フォーム関連
 ├── lib/ (共通ロジック)
 │    ├── calculations/  # 手数料や税金の計算ロジック
 │    └── supabase.ts    # DB接続設定
 └── types/              # TypeScriptの型定義ファイル

```

### ネーミングのポイント

* **Manager / Editor / Tracker:** 単なる「表示」ではなく、ユーザーが操作（追加・修正・追跡）することを明示しています。
* **Ledger (台帳):** 入出金記録などは `Log` よりも、資産管理らしさを出すために `Ledger` という言葉を使うと専門性が高まります。

この構成でプロジェクトをスタートさせる準備（例えば、最初の `package.json` の設定や、基本的なフォルダ作成コマンドなど）をお手伝いしましょうか？
