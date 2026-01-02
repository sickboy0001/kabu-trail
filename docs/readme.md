
新規作成
「KabuTrail」



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

## 2. データベース・テーブル設計案

「一元管理」を実現するために必要となる、リレーショナルデータベース（PostgreSQL / Supabaseなど）を想定したテーブル構成です。

### ① `users` (ユーザー)
**spt_userを利用するので不要**

* `id`: UUID (Primary Key)
* `email`: string
* `display_name`: string

### ② `broker_accounts` (証券口座)

* `id`: int
* `user_id`: UUID (FK)
* `broker_name`: string (野村、松井など)
* `is_nisa`: boolean (NISA口座かどうか)
* `fee_structure_id`: int (適用する手数料セットの参照)

### ③ `trades` (取引履歴)

* `id`: int
* `user_id`: UUID (FK)
* `account_id`: int (FK)
* `ticker_code`: string (銘柄コード)
* `side`: enum (BUY / SELL / MARGIN_BUY / MARGIN_SELL)
* `entry_date`: datetime
* `exit_date`: datetime (決済時のみ)
* `quantity`: decimal (数量)
* `entry_price`: decimal (買値)
* `exit_price`: decimal (売値)
* `fee`: decimal (手数料)
* `tax`: decimal (税金)
* `profit_loss`: decimal (純損益：自動計算)

### ④ `cash_flows` (入出金)

* `id`: int
* `account_id`: int (FK)
* `type`: enum (DEPOSIT / WITHDRAW / DIVIDEND)
* `amount`: decimal
* `executed_at`: date

### ⑤ `fee_structures` (手数料マスター)

* `id`: int
* `name`: string (セット1, セット2)
* `calc_type`: enum (FIXED / PERCENT / DAILY_SUM)
* `threshold`: decimal (閾値：50万など)
* `fee_value`: decimal (手数料率または金額)

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
