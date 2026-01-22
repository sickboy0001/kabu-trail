以下のサイトにダッシュボード機能を追加したいと考えています。



https://github.com/sickboy0001/kabu-trail
のDocに簡単な仕様書は記載しています。

### 要件

* ダッシュボード機能はいまあるのでそれは退避を想定しています。
* dashboard/page.tsxはユーザーのみ
* pages/user/dashboard/DashboardClient.tsxが実態
* pages/user/dashboardSetting/dashboardSettingClient.tsxは設定用の画面
* account\_dashboard\_settings に固有の設定をもつ（supabaseへの保存想定）
* DashboardClientでパターンを指定できること。パターンない場合はデフォルトで「※」の設定を持つものとする
* dashboardは資産情報、評価損益合計、前日比、資産推移（１年間）、損益推移（１年間）、ポートフォリオ、保有銘柄一覧などをもつ
* 資産情報　
  * １列
  * 総資産：現状での現金と保有銘柄の金額の合計
  * 現金
  * 保有銘柄の合計
* 評価損益合計
  * １列
  * 保有中の株価の損益の今の価値が、購入価格とどう変わっているか
  * 取得額との対比
* 前日比
  * １列
  * 保有株が、前日と比較しての合計金額の推移（金額とパーセント）
* 資産推移
  * ２列～６列
  * 指定期間内で月単位の棒グラフ
  * 総資産額がどの程度変わったか
* 損益推移
  * ２列～６列
  * 指定期間内で月単位での０ベースの線グラフ
  * 月ごとのに資産がどう変わったか、クローズした株はクローズ日基準で利益出たかの記録
* ポートフォリオ
  * ２列
  * 保有株の内訳、金額ベース、円グラフ
* 保有銘柄一覧
  * ４列～６列
  * 銘柄、保有数、取得コスト、現在価格（前日比）、評価額、所持日数、評価損益

※サイズ６列
 



追加で自由にデザインを選べるようにする動きを想定しています。
設定自体は別画面でメンテナンスすること


#### 1. データの整合性と更新タイミング（最重要）

* **株価の更新頻度:**
* 株価の更新はリアルタイムで現状での値にする
* 現在価格は市場での値ベース、ダッシュボードの各数値（評価損益や前日比）もリアルタイムでの計算とする。
  * ただし、表示タイミングでの情報とする。別途右上に更新ボタン準備して押下されたときにはデータを取り直す形

* **「前日比」の定義:**
* 所持株の価値での比較
* 前日終値と現状との比較です。総資産額は別に表示する

* **クローズした株の扱い:**
* 損益推移において「クローズした株はクローズ日基準で利益」とありますが、「損益推移」「資産推移」へと反映します。



---


提供されたリポジトリの構成と、記載いただいた要件を拝見しました。
現状のままでも開発に着手できるレベルではありますが、**「実装フェーズで迷いそうな点」**や**「ユーザー体験（UX）を左右する未定義事項」**がいくつかあります。

仕様書をより強固にするために、以下の観点での検討・追記を推奨します。

---



#### 2. レイアウト自由度の仕様（技術的な詰め）

* 「自由にデザインを選べる」とは順番を選べること。複数の類似した項目を追加できる状態を指します。
* 「サイズ（列数）を指定できる」という点について、以下の結論を出しておくと実装がスムーズです。

* **グリッドシステムのルール:**は6列のグリッドで、各コンポーネントが Bootstrap（１２列）でいう`col-span-2` のように幅を取る形式か。
* **配置順序:** ユーザーがドラッグ＆ドロップで並び替えられるようにする。
* 類似した項目も表示できるようにする。
  * 例えば注目している株の一覧に、バケット１の情報（銘柄１，２，３）、バケット２（銘柄３、４，５）の情報などを選べること
* **レスポンシブ対応:**PCで「6列」の設定にした場合、スマホ（1カラム）ではどのような順序で表示させるか。



### 3. 「パターン」の定義

* **パターンの保存単位:** * 「標準レイアウト」は運営が準備、「分析特化レイアウト」などのプリセットは個人が作成するイメージになります。名前も自由に決めれる状態
* また、最後に閲覧したレイアウトは、ダッシュボードの参照履歴として記憶して、次回開いたときにはそのパターンで開くこと
* **デフォルト値の挙動:** * `account_dashboard_settings` にレコードがない新規ユーザーに対し、「標準レイアウト」を基準とする。
* 標準レイアウトは、別にJSONで持つこと。

### 4. 期間切り替えの仕様

資産推移・損益推移について。

* **表示期間の動的変更:** 
* 表示期間は１年、３カ月で展開できること。また、先月末から１年前まで基準にするなど、基準日も選べること（先月末、去年末など）
* 上記情報はJSONBにもち、account_dashboard_settingsに持つこと
* 実際利用するケースとしては。表示期間１年（先月から１年間）、表示期間１年間（去年から１年間）などは対応できること。



### 5. Supabase のテーブル設計（追加すべき項目）

`account_dashboard_settings` に以下のカラムを持たせる結論を出しておくと良いです。

```
[
  {
    "id": "pattern_standard",
    "name": "標準レイアウト",
    "is_default": true,
    "last_accessed_at": "2026-01-22T16:00:00Z",
    "widgets": [
      {
        "id": "widget_1",
        "type": "asset_summary",
        "title": "資産情報",
        "cols": 1,
        "order": 1,
        "settings": {}
      },
      {
        "id": "widget_2",
        "type": "profit_loss_summary",
        "title": "評価損益合計",
        "cols": 1,
        "order": 2,
        "settings": {}
      },
      {
        "id": "widget_3",
        "type": "day_over_day",
        "title": "前日比",
        "cols": 1,
        "order": 3,
        "settings": {}
      },
      {
        "id": "widget_4",
        "type": "asset_history",
        "title": "資産推移（1年）",
        "cols": 3,
        "order": 4,
        "settings": {
          "period": "1y",
          "base_date_type": "last_month_end"
        }
      },
      {
        "id": "widget_41",
        "type": "asset_history",
        "title": "資産推移（前年）",
        "cols": 3,
        "order": 4,
        "settings": {
          "period": "1y",
          "base_date_type": "last_year_end"
        }
      },
      {
        "id": "widget_5",
        "type": "portfolio_pie",
        "title": "ポートフォリオ",
        "cols": 2,
        "order": 5,
        "settings": {
          "display_type": "xxx"
        }
      },
      {
        "id": "widget_6",
        "type": "stock_list",
        "title": "保有銘柄一覧",
        "cols": 6,
        "order": 6,
        "settings": {
          "bucket_id": null
        }
      }
    ]
  },
  {
    "id": "pattern_analysis",
    "name": "分析特化レイアウト",
    "is_default": false,
    "last_accessed_at": "2026-01-20T10:00:00Z",
    "widgets": [
      {
        "id": "widget_7",
        "type": "profit_history",
        "title": "損益推移（3ヶ月）",
        "cols": 4,
        "order": 1,
        "settings": {
          "period": "3m",
          "base_date_type": "current"
        }
      },
      {
        "id": "widget_8",
        "type": "stock_list",
        "title": "注目バケットA",
        "cols": 6,
        "order": 2,
        "settings": {
          "bucket_id": "bucket_001"
        }
      }
    ]
  }
]
```
#### ウィジェット共通プロパティ
type: DashboardClient.tsx でどのコンポーネントをレンダリングするかを判定するキーです（例: asset_history なら棒グラフを表示）。

cols: 1〜6の範囲で指定。CSSの grid-column: span X や Tailwind の col-span-X にマッピングします。

order: 表示順序です。ドラッグ＆ドロップで並び替えた際にこの数値を更新します。

期間切り替えの制御 (settings 内)
資産推移や損益推移で利用します。

period: 1y, 3m, all など。

base_date_type:

current: 現在日基準

last_month_end: 先月末基準

last_year_end: 去年末基準

これにより、「先月末から1年間」といった動的な期間指定をフロントエンドのロジックで計算可能にします。

バケット情報の表示
bucket_id: 保有銘柄一覧などで特定のグループ（バケット）だけを表示したい場合、ここにIDを保持します。null の場合は全保有銘柄を表示する仕様とします。


### 6. グラフライブラリの選定

既存のライブラリを利用する



ご提示いただいた要件に基づき、`account_dashboard_settings` テーブルに保存する JSON 構造のサンプルを作成しました。

この設計では、**「パターンの切り替え」「自由な配置（順序・サイズ）」「各コンポーネント固有の設定（期間やバケット指定）」**を網羅しています。

---

## 1. account_dashboard_settings テーブルのJSONサンプル

ユーザーが複数の「パターン（レイアウト）」を持ち、それぞれに異なるウィジェット配置や設定を保持できる構造です。

```json
[
  {
    "id": "pattern_standard",
    "name": "標準レイアウト",
    "is_default": true,
    "last_accessed_at": "2026-01-22T16:00:00Z",
    "widgets": [
      {
        "id": "widget_1",
        "type": "asset_summary",
        "title": "資産情報",
        "cols": 1,
        "order": 1,
        "settings": {}
      },
      {
        "id": "widget_2",
        "type": "profit_loss_summary",
        "title": "評価損益合計",
        "cols": 1,
        "order": 2,
        "settings": {}
      },
      {
        "id": "widget_3",
        "type": "day_over_day",
        "title": "前日比",
        "cols": 1,
        "order": 3,
        "settings": {}
      },
      {
        "id": "widget_4",
        "type": "asset_history",
        "title": "資産推移（1年）",
        "cols": 3,
        "order": 4,
        "settings": {
          "period": "1y",
          "base_date_type": "last_month_end"
        }
      },
      {
        "id": "widget_5",
        "type": "portfolio_pie",
        "title": "ポートフォリオ",
        "cols": 2,
        "order": 5,
        "settings": {
          "display_type": "amount"
        }
      },
      {
        "id": "widget_6",
        "type": "stock_list",
        "title": "保有銘柄一覧",
        "cols": 6,
        "order": 6,
        "settings": {
          "bucket_id": null
        }
      }
    ]
  },
  {
    "id": "pattern_analysis",
    "name": "分析特化レイアウト",
    "is_default": false,
    "last_accessed_at": "2026-01-20T10:00:00Z",
    "widgets": [
      {
        "id": "widget_7",
        "type": "profit_history",
        "title": "損益推移（3ヶ月）",
        "cols": 4,
        "order": 1,
        "settings": {
          "period": "3m",
          "base_date_type": "current"
        }
      },
      {
        "id": "widget_8",
        "type": "stock_list",
        "title": "注目バケットA",
        "cols": 6,
        "order": 2,
        "settings": {
          "bucket_id": "bucket_001"
        }
      }
    ]
  }
]

```

### 各項目の解説と設計のポイント

#### ウィジェット共通プロパティ

* **`type`**: `DashboardClient.tsx` でどのコンポーネントをレンダリングするかを判定するキーです（例: `asset_history` なら棒グラフを表示）。
* **`cols`**: 1〜6の範囲で指定。CSSの `grid-column: span X` や Tailwind の `col-span-X` にマッピングします。
* **`order`**: 表示順序です。ドラッグ＆ドロップで並び替えた際にこの数値を更新します。

#### 期間切り替えの制御 (`settings` 内)

資産推移や損益推移で利用します。

* **`period`**: `1y`, `3m`, `all` など。
* **`base_date_type`**:
* `current`: 現在日基準
* `last_month_end`: 先月末基準
* `last_year_end`: 去年末基準
* これにより、「先月末から1年間」といった動的な期間指定をフロントエンドのロジックで計算可能にします。


#### バケット情報の表示

* **`bucket_id`**: 保有銘柄一覧などで特定のグループ（バケット）だけを表示したい場合、ここにIDを保持します。`null` の場合は全保有銘柄を表示する仕様とします。




### 3. 実装上のアドバイス

#### グリッドシステムの構築

6列グリッドをベースにする場合、Tailwind CSS をお使いであれば以下のようなラッパーを用意するとスムーズです。

```tsx
// DashboardClient.tsx のイメージ
<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
  {currentPattern.widgets.sort((a, b) => a.order - b.order).map(widget => (
    <div key={widget.id} className={`col-span-1 md:col-span-${widget.cols}`}>
       <WidgetRenderer type={widget.type} settings={widget.settings} />
    </div>
  ))}
</div>

```

#### デフォルト値のハンドリング

1. `account_dashboard_settings` からデータ取得。
2. データが空、または該当ユーザーのレコードがない場合、コード側に定義した「標準レイアウトのJSONオブジェクト」を適用して表示する。
3. 保存ボタン押下時、または初回編集時に Supabase へ `upsert` する。

---

次は、このJSON構造を元にした **「Supabase のテーブル定義（SQL）」** または **「Reactでのコンポーネント構成案」** のどちらについて詳細を詰めたいですか？

JSON構造をベースに、要件である「自由な配置」「パターンの切り替え」「リアルタイム更新」を実現するためのReactコンポーネント構成案を作成しました。

この構成では、**Container/Presenterパターン**を採用し、データの取得・計算ロジックと、見た目の表示を分離することでメンテナンス性を高めています。

---

## 1. ディレクトリ構造案

```text
src/
└── pages/user/dashboard/
    ├── DashboardClient.tsx        # 全体管理（データのフェッチ、パターンの状態管理）
    ├── components/
    │   ├── DashboardHeader.tsx    # パターン切り替え、更新ボタン、設定画面へのリンク
    │   ├── WidgetGrid.tsx         # 6列グリッドのレイアウト制御
    │   └── widgets/               # 各種ウィジェットの実体
    │       ├── AssetSummary.tsx       # 資産情報
    │       ├── ProfitLossSummary.tsx  # 評価損益合計
    │       ├── DayOverDay.tsx         # 前日比
    │       ├── AssetHistoryChart.tsx  # 資産推移（棒グラフ）
    │       ├── ProfitHistoryChart.tsx # 損益推移（線グラフ）
    │       ├── PortfolioPie.tsx       # ポートフォリオ（円グラフ）
    │       └── StockTable.tsx         # 保有銘柄一覧
    └── hooks/
        └── useDashboardData.ts    # 株価計算・集計ロジックをまとめたカスタムフック

```

---

## 2. 主要コンポーネントの役割

### ① DashboardClient.tsx (親コンポーネント)

ここでは、Supabaseから「ユーザー設定（JSON）」と「現在の保有銘柄・取引履歴」を取得し、各ウィジェットに配る準備をします。

```tsx
export default function DashboardClient() {
  const { patterns, currentPattern, setCurrentPattern, refreshData } = useDashboardSettings();
  const { data, loading } = useDashboardData(); // リアルタイム計算ロジック

  return (
    <div className="p-4">
      <DashboardHeader 
        patterns={patterns} 
        activePattern={currentPattern}
        onRefresh={refreshData} 
      />
      
      {/* 6列のグリッドシステム */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
        {currentPattern.widgets.map((w) => (
          <div key={w.id} className={`col-span-1 md:col-span-${w.cols}`}>
            <WidgetRenderer 
              type={w.type} 
              data={data} 
              settings={w.settings} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

```

### ② useDashboardData.ts (計算ロジック)

「現在の評価損益」や「前日比」の計算は、複数のウィジェットで使い回すため、1つのフックに集約します。

* **役割**: 市場価格（リアルタイム）と取得単価を突き合わせ、合計資産額や損益額を算出。
* **更新**: 右上の更新ボタンが押された際に、最新の市場価格を再フェッチする。

### ③ WidgetRenderer.tsx (振り分け)

JSONの `type` に応じて、どのコンポーネントを表示するかを決定します。

```tsx
const WidgetRenderer = ({ type, data, settings }) => {
  switch (type) {
    case 'asset_summary': return <AssetSummary data={data} />;
    case 'asset_history': return <AssetHistoryChart data={data} settings={settings} />;
    case 'stock_list':    return <StockTable data={data} bucketId={settings.bucket_id} />;
    // ...以下続く
  }
};

```

---

## 3. 各ウィジェットの表示イメージ

| コンポーネント名 | 推奨ライブラリ | 表示内容のポイント |
| --- | --- | --- |
| **AssetSummary** | (標準CSS) | 総資産、現金、保有銘柄合計を大きな数字で表示。 |
| **AssetHistoryChart** | Recharts (Bar) | `settings.period` (1年等) に基づき、月別の資産合計を棒グラフ化。 |
| **ProfitHistoryChart** | Recharts (Line) | 0ラインを基準にした損益推移。クローズ済み銘柄の確定益も合算。 |
| **PortfolioPie** | Recharts (Pie) | 銘柄ごとの評価額割合を円グラフで表示。 |
| **StockTable** | (標準Table) | 6列使用。スクロール可能な銘柄一覧。 |

---

## 4. 設定画面 (DashboardSettingClient) のポイント

設定画面では、JSONを直接編集するのではなく、以下のUIを提供します。

* **パターンの追加/編集**: 「名前」の変更や、デフォルトパターンの設定。
* **ドラッグ＆ドロップ**: `dnd-kit` や `react-beautiful-dnd` を使い、ウィジェットの `order` を直感的に変更。
* **サイズ変更**: ドロップダウンやスライダーで `cols` (1〜6) を変更し、即座にプレビューに反映。
* **ウィジェット個別設定**: 「資産推移」なら期間（1年/3ヶ月）、「銘柄一覧」なら表示するバケットを選択するモーダル。

---

## 5. 実装に向けた次のステップ

まずは、**「デフォルトのJSON構造を表示するだけの静的なDashboardClient」**の作成から始めるのがスムーズです。

次は、**「資産推移や損益推移のグラフを表示するための、ダミーデータを含めた実装コード例」**をご覧になりますか？ それとも、**「設定画面での並び替えロジック」**について詳しく知りたいですか？


デフォルトのJSON構造を読み込み、それをグリッドレイアウトに展開する静的な `DashboardClient.tsx` の実装例を作成しました。

このコードでは、将来的に各ウィジェットに本物のデータやロジックを組み込みやすいよう、**「型定義」**と**「コンポーネントの振り分けロジック」**を整理しています。

---

### 1. DashboardClient.tsx の実装

```tsx
import React, { useState } from 'react';

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
  widgets: Widget[];
};

// --- デフォルトのJSON構造（初期表示用） ---
const DEFAULT_PATTERN: DashboardPattern = {
  id: "pattern_standard",
  name: "標準レイアウト",
  is_default: true,
  widgets: [
    { id: "w1", type: "asset_summary", title: "資産情報", cols: 1, order: 1, settings: {} },
    { id: "w2", type: "profit_loss_summary", title: "評価損益合計", cols: 1, order: 2, settings: {} },
    { id: "w3", type: "day_over_day", title: "前日比", cols: 1, order: 3, settings: {} },
    { id: "w4", type: "asset_history", title: "資産推移（1年）", cols: 3, order: 4, settings: { period: "1y" } },
    { id: "w5", type: "portfolio_pie", title: "ポートフォリオ", cols: 2, order: 5, settings: {} },
    { id: "w6", type: "stock_list", title: "保有銘柄一覧", cols: 4, order: 6, settings: {} },
  ]
};

// --- 仮のウィジェットコンポーネント ---
const PlaceholderWidget = ({ widget }: { widget: Widget }) => (
  <div className="h-full min-h-[150px] p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
    <h3 className="text-sm font-bold text-gray-500 mb-2 border-b pb-1">{widget.title}</h3>
    <div className="flex-grow flex items-center justify-center text-gray-400 italic">
      {widget.type} (cols: {widget.cols})
    </div>
  </div>
);

// --- メインコンポーネント ---
const DashboardClient = () => {
  // 実際には Supabase から取得するが、一旦定数を使用
  const [currentPattern] = useState<DashboardPattern>(DEFAULT_PATTERN);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* ヘッダーエリア */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{currentPattern.name}</h1>
          <p className="text-sm text-gray-500">ダッシュボードの概要を表示しています</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50">🔄 更新</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700">⚙️ 設定</button>
        </div>
      </div>

      {/* グリッドレイアウトエリア */}
      {/* md:grid-cols-6 でPC版は6列。 
          gap-4 でウィジェット間の隙間を確保。
      */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {currentPattern.widgets
          .sort((a, b) => a.order - b.order)
          .map((widget) => (
            <div
              key={widget.id}
              style={{
                // Tailwindの動的な col-span はパージされる可能性があるため、style or 固定クラスを使用
                gridColumn: `span ${widget.cols} / span ${widget.cols}`
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

```

---

### この構成のポイント

1. **Gridの制御**:
`grid-cols-6` を親に持ち、子要素の `gridColumn: span X` で幅を決定しています。これにより、「1列（小）」「3列（中）」「6列（全幅）」といった柔軟なレイアウトが、JSONの `cols` パラメータだけで操作可能です。
2. **Order（順序）の制御**:
`.sort((a, b) => a.order - b.order)` を入れることで、JSON内の記述順に依存せず、ユーザーが指定した順序で並び替える準備ができています。
3. **拡張性**:
`PlaceholderWidget` の部分を、将来的に `switch(widget.type)` を使った `WidgetRenderer` コンポーネントに差し替えるだけで、中身を本物のグラフやテーブルに置き換えられます。

---

### 次のステップへの提案

この静的な画面が表示できたら、次は**「各ウィジェットの中身の実装」**に進むのが良いかと思います。

特に重要なのは以下のどれでしょうか？

* **A: 資産推移・損益推移のグラフ表示**（Rechartsを使った実装例）
* **B: 保有銘柄一覧のテーブル実装**（スクロールや前日比のカラーリング）
* **C: 設定画面（DashboardSettingClient）での並び替え・サイズ変更UI**

どれから詳細を確認したいですか？

設定画面（`DashboardSettingClient`）では、ユーザーが直感的に「どの項目を」「どのくらいの大きさで」「どの順番に」並べるかを操作できる必要があります。

ここでは、実用性の高い **`dnd-kit`**（Reactで最もモダンなドラッグ＆ドロップライブラリ）を使用した実装イメージを提案します。

---

### 1. 設定画面の全体構成案

設定画面では、左側に「現在のレイアウトプレビュー（並び替え可能）」、右側に「ウィジェットの追加や詳細設定」を配置する構成が一般的です。

```tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

// 前述の Widget 型を使用
import { SortableWidgetCard } from './components/SortableWidgetCard';

export default function DashboardSettingClient({ initialPattern }) {
  const [pattern, setPattern] = useState(initialPattern);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 並び替え完了時の処理
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPattern((prev) => {
        const oldIndex = prev.widgets.findIndex((w) => w.id === active.id);
        const newIndex = prev.widgets.findIndex((w) => w.id === over.id);
        const newWidgets = arrayMove(prev.widgets, oldIndex, newIndex).map((w, i) => ({
          ...w,
          order: i + 1, // 順序を再採番
        }));
        return { ...prev, widgets: newWidgets };
      });
    }
  };

  // サイズ（列数）変更の処理
  const updateWidgetCols = (id, newCols) => {
    setPattern((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, cols: newCols } : w)),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">ダッシュボード設定: {pattern.name}</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded">保存する</button>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* 6列グリッドのプレビュー */}
        <div className="grid grid-cols-6 gap-4 bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300">
          <SortableContext items={pattern.widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            {pattern.widgets.map((widget) => (
              <SortableWidgetCard 
                key={widget.id} 
                widget={widget} 
                onColsChange={updateWidgetCols}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}

```

---

### 2. 各ウィジェットカード（SortableWidgetCard.tsx）

各カード内で「列数（1〜6）」をドロップダウンで変更できるようにします。

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableWidgetCard({ widget, onColsChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.cols}`,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg shadow-sm p-3 ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        {/* ドラッグハンドル */}
        <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-gray-100 rounded">
          ⠿
        </div>
        <span className="text-xs font-bold truncate flex-1 ml-2">{widget.title}</span>
        
        {/* サイズ変更セレクトボックス */}
        <select 
          value={widget.cols} 
          onChange={(e) => onColsChange(widget.id, Number(e.target.value))}
          className="text-xs border rounded p-1"
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>{n}列</option>
          ))}
        </select>
      </div>
      
      <div className="h-12 bg-gray-50 rounded flex items-center justify-center text-[10px] text-gray-400">
        PREVIEW
      </div>
    </div>
  );
}

```

---

### 3. UIのポイントと工夫

1. **リアルタイムプレビュー**:
設定画面自体がダッシュボードと同じ `grid-cols-6` を持っているため、サイズを変更するとその場でレイアウトがガタガタと動いて調整されます。ユーザーは「保存後にどう見えるか」を完璧に把握できます。
2. **ドラッグハンドル**:
カード全体をドラッグ対象にすると、サイズ変更のセレクトボックスが操作しづらくなるため、`⠿` のような小さなハンドル部分のみを `listeners`（ドラッグ開始トリガー）に設定するのがUX上の定石です。
3. **レスポンシブの考慮**:
設定画面では「PCでの見え方」を優先して6列表示にしますが、スマホで見ると自動的に `col-span-6`（全幅）になるようCSS（Tailwindの `md:grid-cols-6`）で制御します。

---

### 4. 実装後の動作イメージ

* **並び替え**: 資産情報（1列）と保有銘柄（4列）の順番を入れ替えると、自動的に隙間を埋めるように再配置されます。
* **サイズ変更**: 資産推移を「3列」から「6列」に変えた瞬間、そのウィジェットが横いっぱいに広がり、後続のウィジェットが下の行へ押し出されます。

次は、これらの設定を **「Supabase の JSONB カラムへ保存し、ページ遷移時に復元するロジック（API連携）」** について詳しく解説しましょうか？

なお、各種アプリのすべての機能を使用するには、[Gemini アプリ アクティビティ](https://myactivity.google.com/product/gemini)を有効にする必要があります。