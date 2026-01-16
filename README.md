# KabuTrail (カブトレイル)

**KabuTrail** は、複数の証券口座や持株会、投資信託が混在する環境において、純粋な「トレード（個別株売買）」による収益を正確に分離・可視化するための資産管理ツールです。

## 開発の背景

現在、多くの証券口座では投資信託や会社から配布された株（持株会など）が同一口座内で管理されており、特定のトレードのみで「実際にいくら利益が出ているのか」を把握することが困難です。
特に会社配布の株は売却制限などがあるため、これらを通常の売買記録から分離し、手数料や税金を考慮した「真の損益」を算出することを目的に本プロジェクトを開発しています。

## 主な機能

* **トレード記録の正確な管理**: 証券会社ごとの手数料、税率を反映した精密な損益計算。
* **資産の分離管理**: 特定のトレード、新NISA、持株会などを切り分けて把握。
* **入出金管理**: 証券口座への入出金履歴を記録し、月ごとの資産推移を可視化。
* **市場データ連携**: Yahoo APIから取得済みの株価データを利用した、正確な銘柄情報の参照。

## 🚀 特徴

- **マーケット概況の確認**: ログイン前でも日経平均や為替などの主要指標をクイックに確認。
- **Supabase認証**: セキュアなログインとユーザーごとのデータ管理。
- **直感的なダッシュボード**: 資産状況や最近の取引をグラフィカルに表示。
- **App Router (Next.js 15)**: 最新のReactフレームワークによる高速な画面遷移と最適化。
- **レスポンシブデザイン**: Tailwind CSSを採用し、PC・スマホ両方からの閲覧に対応。


## システム構成・データモデル

### 1. マスタデータ

* **証券会社 (Broker)**: 各証券会社の定義。
* **手数料 (Fee)**: 証券会社ごとの手数料体系の保持。
* **税金**: 適用される税率情報の管理。

### 2. ユーザーデータ

* ユーザーごとに利用する証券会社と手数料を紐付け。
* **手数料カスタマイズ**: 個人設定として手数料の微調整が可能。
* **口座属性**: 特定の取引が「NISA」枠であるかどうかのフラグ管理。

### 3. トレード・資金データ

* **トレード記録**: 売買日時、銘柄、数量、価格の自由かつ正確な入力。
* **入出金記録**: 証券口座に対する入金・出金の履歴管理（日時・金額）。
* **推移把握**: 月次単位でのパフォーマンスレポート。

### 4. 市場データ

* Yahoo APIより取得済みの株価・銘柄情報を活用し、入力時の正確性を担保（インポート処理実装済み）。

## 🛠 技術スタック

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React
- **Backend/Auth**: Supabase (PostgreSQL)
- **Library**: @supabase/ssr (Server-side rendering support)

## 📂 ディレクトリ構成

- `src/app`: 画面（Pages）およびルートハンドラー
  - `(auth)`: ログイン・サインアップ関連
  - `(user)`: ダッシュボード・取引管理など認証後ページ
- `src/components`: 再利用可能なUIコンポーネント
- `src/lib`: Supabaseクライアントなどの共通ロジック
- `src/middleware.ts`: 認証状態に基づいたリダイレクト制御

## 🛠 セットアップと実行

1. **依存関係のインストール**:

```bash
   npm install

```

2. **環境変数の設定**:
`.env.local` ファイルを作成し、Supabaseのプロジェクト情報を設定してください。
```text
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

```


3. **開発サーバーの起動**:
```bash
npm run dev

```



## 📅 今後のロードマップ

* [ ] 取引登録フォームの実装（銘柄・数量・価格）
* [ ] 損益推移のグラフ表示（Chart.js / Recharts）
* [ ] カレンダー表示機能
* [ ] CSVインポート機能

## 📄 ライセンス

Personal Project - KabuTrail


### 反映方法

1.  VS Code で `README.md` を開き、上記の内容を貼り付けて保存します。
2.  ターミナルで以下のコマンドを実行して GitHub にプッシュします。

```powershell
git add README.md
git commit -m "docs: add comprehensive README"
git push origin main

```

## links
- [Vercel](https://kabu-trail.vercel.app/)
- [Github](https://github.com/sickboy0001/kabu-trail)


## todo

- [ ] MacDの表示
- [ ] 移動平均線
- [x] Toastでの通知（Backets削除）


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
