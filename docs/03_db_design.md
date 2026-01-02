[Top](./README.md)

# データ設計（外部的な観点）

作成済み、実用済みのテーブル構造
すでにあるもので、実用済みの既存のものです。

## 1. テーブル一覧
現在、システムで利用されている主要なテーブルの一覧です。リンクをクリックすると、ページ内の詳細項目へ移動します。

| カテゴリ | テーブル名 | 概要 |
| --- | --- | --- |
| **株価・銘柄** | spt_daily_quotes | 日次株価データ（始値・高値・安値・終値・出来高） |
|  | spt_company_stock_details| 株式の財務詳細情報（時価総額、PER、PBR、配当等） |
|  | jpx_company_master | JPX（日本取引所グループ）提供の銘柄マスタ |
| **ユーザー・権限** | spt_user | ユーザー基本情報（Supabase Authと連携） |
|  | roles| 権限・ロール定義マスタ |
|  | user_roles| ユーザーへのロール割り当て管理 |
| **ポートフォリオ** | spt_portals| ユーザー作成のポートフォリオ（銘柄リストの親） |
|  | spt_portal_stocks | ポートフォリオに含まれる銘柄の管理 |
| **ログ・通知** | spt_stock_view_history | ユーザーによる銘柄の参照履歴ログ |
|  | spt_notifications | ユーザーへの売買シグナルや情報通知 |


## 2. 主要エンティティとデータ項目
### テーブル作成時共通の処理

- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
- RLS (Row Level Security) を無効にする場合はここで設定

<details>
<summary>common_query</summary>

```sql
-- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
-- RLS (Row Level Security) を無効にする場合はここで設定
ALTER TABLE public.ｘｘｘｘ DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO anon;
GRANT USAGE ON SCHEMA "public" TO authenticated;

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;
```

</details>


### spt_daily_quotes

| カラム名        | 型           | 補足                |
| ----------- | ----------- | ----------------- |
| code        | `text`      | 銘柄コード（例: 7203）PK  |
| date        | `date`      | 日付（例: 2024-06-01）PK|
| open        | `numeric`   | 始値                |
| high        | `numeric`   | 高値                |
| low         | `numeric`   | 安値                |
| close       | `numeric`   | 終値                |
| volume      | `bigint`    | 出来高               |
| created_at | `timestamp` | データ挿入日時（自動）       |


```sql
CREATE TABLE spt_daily_quotes (
    code TEXT NOT NULL,
    date DATE NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (code, date) -- こちらに変更
);
```

### spt_stock_view_history
| カラム名   | 型                       | 補足                                                                              | 
| ---------- | ------------------------ | --------------------------------------------------------------------------------- | 
| id         | BIGSERIAL                | 主キー。参照履歴の一意な識別子。自動採番。                                        | 
| user_id    | UUID                     | 参照したユーザーのID。stock_user テーブルの id を参照。                           | 
| stock_code | TEXT                     | 参照した銘柄のコード。spt_daily_quotes または spt_stocks テーブルの code を参照。 | 
| viewed_at  | TIMESTAMP WITH TIME ZONE | 銘柄が参照された日時。自動的に現在日時が設定されます。                            | 

### spt_user 

**ユーザー情報**

|カラム名|型|補足|
|-------|---|----|
|id|UUID|主キー (Supabase認証のauth.users.id と連携)|
|email|TEXT|ユーザーのメールアドレス (NULL許容、auth.users と同期)|
|name|TEXT|ユーザーの表示名 (NULL許容)|


### roles 

**役割マスタ**

|カラム名|型|補足|
|-------|---|----|
|id|SERIAL|主キー (自動採番)|
|name|TEXT|役割名 (例: 'Manager', 'Member') |UNIQUE NOT NULL|
|short_name|TEXT|役割名 'MAN', 'MEM','ADMI'|NOT NULL|
|description	|TEXT	|役割の説明 (任意)|
|created_at	|TIMESTAMPTZ	|作成日時 (デフォルト: 現在時刻)|

### user_roles 
**ユーザーと役割の中間テーブル**
|カラム名|型|補足|
|-------|---|----|
|id|INTEGER|主キー|
|user_id|UUID|spt_user.id を参照 (ON DELETE CASCADE)|
|role_id|INTEGER|roles.id を参照 (ON DELETE CASCADE)|
|assigned_at|TIMESTAMPTZ|役割が割り当てられた日時 (デフォルト: 現在時刻, 任意)|


### spt_portals
**ユーザーが作成するポートフォリオ**
ユーザーが作成するポートフォリオ（銘柄リストのまとまり）を格納するテーブルです

| カラム名      | 型        | 補足| 
| ------------- | --------- | ----------- | 
| id            | uuid      | 主キー（Supabaseのgen_random_uuid()などで自動生成）。                                                                                                   | 
| user_id       | uuid      | ポートフォリオを作成したユーザーのID。stock_usersテーブルのidを参照し、ユーザー削除時にはポートフォリオも削除されます。NOT NULL制約で必須項目とします。 | 
| name          | text      | ポートフォリオ名。ユーザーごとに一意である必要があります。NOT NULL制約で必須項目とします。  | 
| memo          | text      | ポートフォリオに関する注釈やメモ（任意項目）。| 
| created_at    | timestamp | レコードが挿入された日時。now()で自動的にタイムスタンプが設定されます。 | 
| display_order | integer   | ポートフォリオ一覧での表示順（小さいほど上位に表示）。デフォルト値は0です。| 



### spt_portal_stocks
**ポータルと銘柄のリレーション**
- 多対多対応  
- spt_portalsテーブルと株銘柄（stock_daily_quotesテーブルに紐づく概念）の多対多のリレーションを管理する中間テーブルです。特定のポートフォリオにどの銘柄が追加されているかを管理します。

| カラム名      | 型        | 補足| 
| ------------- | --------- | --- | 
| id            | uuid      | 主キー（Supabaseのgen_random_uuid()などで自動生成）。                                                                                               | 
| portal_id     | uuid      | 関連するポートフォリオのID。stock_portalsテーブルのidを参照し、ポートフォリオ削除時にはこのレコードも削除されます。NOT NULL制約で必須項目とします。 | 
| stock_code    | text      | ポートフォリオに追加された銘柄のコード（例: '7203'）。NOT NULL制約で必須項目とします。                                                              | 
| added_at      | timestamp | 銘柄がポートフォリオに追加された日時。now()で自動的にタイムスタンプが設定されます。                                                                 | 
| display_order | integer   | ポートフォリオ内での銘柄の表示順。デフォルト値は0です。                                                                                             | 
| group_name    | text      | 銘柄のグループ名（任意項目）。例: '成長株', '高配当' など。                                                                                         | 
| memo          | text      | 個々の銘柄に対する注釈やメモ（任意項目）。                                                                                                          | 


### spt_company_stock_details
**株式の詳細**

| カラム名             | 型           | 説明                |
| ---------------- | ----------- | ----------------- |
| `code`         | VARCHAR(10) | 株式コード（ユニーク）       |
| `market_cap`     | BIGINT      | 時価総額（百万円）         |
| `issued_shares`  | BIGINT      | 発行済株式数            |
| `div_yield`      | FLOAT       | 配当利回り（%）          |
| `dividend`       | FLOAT       | 1株配当（円）           |
| `per`            | FLOAT       | PER（倍）            |
| `pbr`            | FLOAT       | PBR（倍）            |
| `eps`            | FLOAT       | EPS（円）            |
| `bps`            | FLOAT       | BPS（円）            |
| `roe`            | FLOAT       | ROE（%）            |
| `equity_ratio`   | FLOAT       | 自己資本比率（%）         |
| `min_price`      | INTEGER     | 最低購入代金（円）         |
| `unit_shares`    | INTEGER     | 単元株数              |
| `high_price_ytd` | INTEGER     | 年初来高値（円）          |
| `low_price_ytd`  | INTEGER     | 年初来安値（円）          |
| `roa`            | FLOAT       | ROA（%）            |
| `operating_margin`| FLOAT       | 営業利益率（%）         |
| `free_cash_flow` | BIGINT      | フリーキャッシュフロー（百万円） |
| `interest_coverage`| FLOAT       | インタレストカバレッジレシオ |
| `beta`           | FLOAT       | ベータ値              |
| `peg_ratio`      | FLOAT       | PEGレシオ            |
| `updated_at`     | DATE        | 最終更新日（YYYY-MM-DD） |


### spt_notifications

| カラム名 | 型 | 補足 |
| --- | --- | --- |
| id | `uuid` | 主キー |
| user_id | `uuid` | 通知対象のユーザーID |
| stock_code | `text` | 対象銘柄コード |
| type | `text` | 通知の種類 ('BUY_SIGNAL', 'SELL_SIGNAL', 'INFO' など) |
| message | `text` | 通知メッセージの内容 |
| is_read | `boolean` | 既読/未読フラグ |
| created_at | `timestamp` | 通知が生成された日時 |


### jpx_company_master
| カラム名         | データ型   | NULL許容 | 説明         | 主キー/その他                  | 
| ---------------- | ---------- | -------- | ------------------------------------------------ | ------------------------------ | 
| code| TEXT       | NO       | 銘柄コード（例: "1301", "130A"）                 | 主キー (一意性が保証される)    | 
| company_name     | TEXT       | NO       | 銘柄名（例: "極洋"）                             |                                | 
| market_segment   | TEXT       | NO       | 市場・商品区分（例: "プライム（内国株式）"）     |                                | 
| industry_33_code | TEXT       | YES      | 33業種コード（例: "50", "-" は空文字列）         | NULL許容（ETFなどの場合）      | 
| industry_33_name | TEXT       | YES      | 33業種区分（例: "水産・農林業", "-" は空文字列） | NULL許容（ETFなどの場合）      | 
| industry_17_code | TEXT       | YES      | 17業種コード（例: "1", "-" は空文字列）          | NULL許容（ETFなどの場合）      | 
| industry_17_name | TEXT       | YES      | 17業種区分（例: "食品", "-" は空文字列）         | NULL許容（ETFなどの場合）      | 
| scale_code       | TEXT       | YES      | 規模コード（例: "7", "-" は空文字列）            | NULL許容（ETFなどの場合）      | 
| scale_name       | TEXT       | YES      | 規模区分（例: "TOPIX Small 2", "-" は空文字列）  | NULL許容（ETFなどの場合）      | 
| updated_at       | TIMESTAMPZ | NO       | レコード最終更新日時                             | NOW() のデフォルト値を設定推奨 | 


importjpx01.html：
[その他統計資料](https://www.jpx.co.jp/markets/statistics-equities/misc/01.html)のXmlから取得する。
そこから、Xmlを開いて、全選択して、インポート画面へコピー


### Supabase PostgreSQL Function
できるだけ利用しないようにする。**Server Actions**をできるだけ利用する。
- /app/actions/stock.ts (Server Actions) 「フォームの送信」や「データ変更」など、特定のUI操作に紐づくサーバーサイドの処理に特化しています。
- /api/stock.ts (Route Handler) 従来のAPIルート（Pages Routerのpages/apiに相当）のApp Router版です。
#### get_period_stock_views
- Supabase PostgreSQL Function: get_period_stock_views
- 指定された期間内の株価参照履歴を集計し、
- 銘柄コード、銘柄名、市場、業種、期間内の参照件数、期間内最新参照日時を返します。


#### handle_new_user
- Supabase PostgreSQL Function: handle_new_user
- ユーザー作成時、sp_user作成するためのトリガー



#### get_all_daily_quotes_periods
- Supabase PostgreSQL Function: get_all_daily_quotes_periods
- 株価データ取得の期間を取得する関数



#### get_portfolio_stock_details
- ポートフォリオIDに基づいて、ポートフォリオ内の各銘柄の詳細情報を取得します。
- 銘柄の基本情報、詳細情報（年初来高値・安値）、最新の株価終値、および前日の株価終値を含みます。


#### get_users_with_roles_and_status
- public.get_users_with_roles_and_status(): ユーザー一覧と役割情報を取得
- 管理画面表示用に、ユーザー名、メール、役割、ステータスでフィルタリングし、ページネーションも考慮
  


