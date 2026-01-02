
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