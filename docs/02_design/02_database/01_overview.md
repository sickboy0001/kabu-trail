[Top](../../readme.md)

# データ設計（外部的な観点）


## 1. テーブル一覧
現在、システムで利用されている主要なテーブルの一覧です。リンクをクリックすると、ページ内の詳細項目へ移動します。

| カテゴリ | テーブル名 | 役割 |
| --- | --- | --- |
| **株価・銘柄** | [spt_stocks](./02_schema-design.md#spt_stocks) | 銘柄の基本情報（コアテーブル） |
|  | [spt_daily_quotes](./02_schema-design.md#spt_daily_quotes) | 日次株価の時系列データ |
|  | [spt_company_stock_details](./02_schema-design.md#spt_company_stock_details) | 財務指標（PER, PBR等）の詳細 |
|  | [jpx_company_master](./02_schema-design.md#jpx_company_master) | JPX提供の公式銘柄マスタ |
| **ユーザー・権限** | [spt_user](./02_schema-design.md#spt_user) | ユーザー基本情報（Auth連携） |
|  | [roles](./02_schema-design.md#roles) | 役割定義（管理者・一般等） |
|  | [user_roles](./02_schema-design.md#user_roles) | ユーザーへのロール割り当て |
| **バスケット・ポータル** | [stock_baskets](./02_schema-design.md#stock_baskets) | 簡易分類用バスケット（親） |
|  | [stock_basket_items](./02_schema-design.md#stock_basket_items) | バスケット内銘柄リスト |
|  | [spt_portals](./02_schema-design.md#spt_portals) | ポートフォリオ（詳細管理用・親） |
|  | [spt_portal_stocks](./02_schema-design.md#spt_portal_stocks) | ポートフォリオ内銘柄・属性管理 |
| **口座・手数料** | [brokers](./02_schema-design.md#brokers) | 証券会社マスタ |
|  | [fee_templates](./02_schema-design.md#fee_templates) | 手数料プラン（コース）定義 |
|  | [fee_rules](./02_schema-design.md#fee_rules) | プラン別の手数料計算ルール |
|  | [broker_accounts](./02_schema-design.md#broker_accounts) | ユーザーの証券口座設定 |
|  | [account_fee_rules](./02_schema-design.md#account_fee_rules) | 個別口座専用の手数料ルール |
| **ログ・通知** | [spt_stock_view_history](./02_schema-design.md#spt_stock_view_history) | 銘柄参照履歴ログ |
|  | [spt_notifications](./02_schema-design.md#spt_notifications) | 売買シグナル等の通知 |
|  | [observation_logs](./02_schema-design.md#observation_logs) | 市場・トレード観察日記 |


## 2. 主要エンティティとデータ項目
### テーブル作成時共通の処理

- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
- RLS (Row Level Security) を無効にする場合はここで設定
