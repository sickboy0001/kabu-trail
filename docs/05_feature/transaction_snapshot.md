元のソースは以下です。
https://github.com/sickboy0001/kabu-trail

その上以下の要件を満たす仕様を考えたいです。

### 要件

* データ量が多いシナリオに対応できるようにトランサクションのデータ以外にもスナップショット（締め処理）のデータをもつ
* 利用者は意識せずとも使うシナリオを想定
  * 初回時間かかる
  * ２回目はスナップショットが利用できるため時間が短くなる
  * 自動で作成する形が望ましい
* スナップショットは月次とする。（内部的には日付で持つが内部処理自体は月次を想定）
* 別画面でスナップショットの状況確認できる。
* 手動でのスナップショットも可能とする。
## account_balances_snapshots 
テーブル案です。


| カラム名 | 型 | 制約 | 役割・備考 |
| --- | --- | --- | --- |
| **id** | bigint | PK | 一意の識別子 |
| **user_id** | uuid | FK, Index | ユーザー特定用 |
| **account_id** | integer | FK, Index | 証券口座特定用 |
| **as_of_date** | date | Index | **締日。月末日を想定。** |
| **balance_type** | text | Index | `CASH`, `MARKET_VALUE`, `CREDIT_PRINCIPAL` |
| **amount** | numeric | NOT NULL | その時点の確定残高 |
| **is_verified** | boolean | Default: false | CSV等の証券会社データと一致が確認されたか |
| **is_manual** | boolean | Default: false | 手動調整用 |
| **memo** | text | - | 調整理由など |
| **updated_at** | timestamp | - |  |
| **created_at** | timestamp | - |  |


ご提示いただいたGitHubリポジトリ（kabu-trail）の構造と、新しい要件を統合した仕様案を整理しました。

大量のデータを扱う際、毎回全期間のトランザクション（取引履歴）を計算するのは現実的ではないため、**「過去の確定地点（スナップショット）」を足がかりに、最新分だけを計算する**というアプローチは非常に効率的です。


**複合インデックスの推奨:**
`(user_id, account_id, as_of_date)` の複合インデックスを貼ることで、特定の月の残高取得を高速化します。


---

## 1. テーブル設計のブラッシュアップ

ご提示いただいた `account_balances_snapshots` テーブル案は非常に網羅的です。インデックス設計を含めた詳細案を以下にまとめます。

---

## 2. システムシーケンス（自動計算ロジック）

「利用者が意識せず、2回目から早くなる」挙動を実現するためのロジックです。

### 計算アルゴリズムの流れ

1. **直近スナップショットの探索**:
対象口座の `as_of_date` が最新のスナップショット（例：2023-12-31）を取得します。
2. **差分計算**:
スナップショットがある場合、`2024-01-01` から `現在時刻` までのトランザクションのみを読み込み、スナップショットの `amount` に加算します。
3. **スナップショットの自動生成（バックグラウンド）**:
計算完了後、もし「先月末」のスナップショットが存在しない場合、バックグラウンドプロセス（または非同期処理）で、その時点の計算結果を新しいスナップショットとして保存します。

---

## 3. 実装のポイント

### A. スナップショットの信頼性管理 (`is_verified`)

* **自動生成時**: トランザクションから計算して作成したものは `is_verified = false` とします。
* **照合時**: ユーザーが証券会社から取得した「月末残高」のCSVをアップロードした際、計算値と一致すれば `true` に更新します。これにより、過去の計算ミスが将来に波及するのを防ぐ「防波堤」になります。

### B. UI/UX 仕様（別画面での状況確認）

スナップショット管理画面では、以下の情報を見える化します。

* **ステータス表示**: 「確定済み（Verified）」「推定値（Auto-calculated）」の区別。
* **再計算ボタン**: 過去の取引データを修正した場合に、それ以降のスナップショットを連鎖的に再計算する機能。
* **手動補正**: システム上の計算と実際の資産額がズレた際、`is_manual = true` として強制的に残高を上書きできる機能。

### C. 初回実行時のハンドリング

初回はスナップショットが一切ないため全期間計算になります。

* フロントエンドで「初回データ構築中...」といったプログレスバーを表示。
* 計算完了後に、月ごとのスナップショットを一括で一気に作成（バルクインサート）することで、次回以降のパフォーマンスを確保します。

---

## 次のステップへの提案

この仕様を実装するにあたり、まずは以下のどちらから着手するのがよろしいでしょうか？

1. **Prisma/SQLでのテーブル定義作成**: 実際のマイグレーションファイルの作成。
2. **残高計算サービス（ロジック）のプロトタイプ作成**: スナップショットがある場合とない場合で条件分岐するTypeScript関数の実装。

よろしければ、**特定のプログラミング言語（TypeScript/Go等）での実装サンプル**を提示することも可能です。


TypeScriptで実装する際のロジックのプロトタイプを作成しました。

このロジックの肝は、**「最後に信頼できるデータ（スナップショット）はどこか？」**を探し、そこから現在までのトランザクションだけを積み上げる点にあります。

### スナップショット活用型の残高計算ロジック

```typescript
import { PrismaClient } from '@prisma/client'; // Prismaを想定
const prisma = new PrismaClient();

interface BalanceResult {
  asOfDate: Date;
  cashBalance: number;
  marketValue: number;
  isFromSnapshot: boolean;
}

/**
 * 特定のユーザー・口座の最新残高を計算するサービス
 */
export const calculateCurrentBalance = async (
  userId: string,
  accountId: number,
  targetDate: Date = new Date()
): Promise<BalanceResult> => {

  // 1. 最新のスナップショットを取得（月次）
  const latestSnapshot = await prisma.accountBalancesSnapshots.findFirst({
    where: {
      userId,
      accountId,
      as_of_date: { lte: targetDate },
    },
    orderBy: { as_of_date: 'desc' },
  });

  // 2. 計算の開始基準日と基準金額を設定
  let baseDate = new Date(0); // スナップショットがない場合は全期間（エポックタイム）
  let baseCashAmount = 0;
  let hasSnapshot = false;

  if (latestSnapshot) {
    baseDate = latestSnapshot.as_of_date;
    baseCashAmount = Number(latestSnapshot.amount);
    hasSnapshot = true;
  }

  // 3. 基準日以降のトランザクションのみを取得して加算
  // リポジトリ(kabu-trail)のトランザクション構造に合わせる（例: type='DEPOSIT'等）
  const transactions = await prisma.transactions.findMany({
    where: {
      accountId,
      userId,
      execution_date: {
        gt: baseDate, // 基準日より後のものだけ
        lte: targetDate,
      },
    },
    orderBy: { execution_date: 'asc' },
  });

  // 4. 差分計算（簡易的な例）
  const currentCashBalance = transactions.reduce((acc, tx) => {
    // 入金・売却ならプラス、出金・購入ならマイナス
    return acc + Number(tx.amount); 
  }, baseCashAmount);

  // 5. 【自動化】もし先月末のスナップショットがなければ作成するロジック（非同期を推奨）
  // ここでバックグラウンド実行をトリガーするなどの処理が入る

  return {
    asOfDate: targetDate,
    cashBalance: currentCashBalance,
    marketValue: 0, // 時価評価額は別途計算が必要
    isFromSnapshot: hasSnapshot,
  };
};

```

---

### 実装のポイントと工夫

#### 1. データの整合性確保

スナップショットの `as_of_date` は、その日の「取引終了後」の状態を指すように定義します。そのため、トランザクションの取得条件は `gt: baseDate`（基準日より後）としています。

#### 2. 自動スナップショット作成のタイミング

「2回目は早くなる」を実現するために、以下のタイミングで `createSnapshot` を呼び出します。

* **計算完了時**: 計算した結果が「月末」を跨いでいる場合、その月末時点の計算結果を保存。
* **非同期処理**: 計算プロセス自体を重くしないよう、保存処理は `await` せずバックグラウンドで走らせるか、Queue（BullMQなど）に投げます。

#### 3. 手動修正（`is_manual`）の扱い

`latestSnapshot` を取得する際、`is_manual: true` のデータがあっても、それが最新であればそれを「正しい起点」として採用します。これにより、システムの計算ミスを人間が修正した際、それ以降の計算も自動的に正しくなります。

---

### 次のステップの提案

このプロトタイプをベースに、**「月末日を自動判定してスナップショットを生成する関数」**の実装へ進めましょうか？

それとも、**スナップショットが古い場合に、それ以降の月次スナップショットを連鎖的に再生成する（バッチ処理的な）ロジック**の詳細を詰めますか？

