export type ObservationLog = {
  id: number;
  userId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  stocks: string[];
  content: string;
  tags: string[];
};

export const observationLogs: ObservationLog[] = [
  {
    id: 1,
    userId: "sample-user-uuid",
    date: "2025/12/15",
    createdAt: "2025/12/15 10:00",
    updatedAt: "2025/12/15 10:00",
    isActive: true,
    stocks: ["2681"],
    content:
      "直近の決算は良好。リユース市場は底堅い印象。2500円ラインを維持できるか注視。配当利回りも魅力的になってきた。",
    tags: ["観察中", "高配当"],
  },
  {
    id: 2,
    userId: "sample-user-uuid",
    date: "2025/11/30",
    createdAt: "2025/11/30 14:30",
    updatedAt: "2025/11/30 14:30",
    isActive: true,
    stocks: ["7203"],
    content:
      "為替の変動に敏感。1ドル150円台での推移が続くなら、次期上方修正の可能性あり。EV戦略の進捗がニュースに出るたびにボラティリティ上がる。",
    tags: ["為替影響", "大型株"],
  },
  {
    id: 3,
    userId: "sample-user-uuid",
    date: "2025/10/20",
    createdAt: "2025/10/20 09:15",
    updatedAt: "2025/10/20 09:15",
    isActive: true,
    stocks: ["8306", "8316"],
    content:
      "日銀の政策決定会合待ち。金利上昇シナリオは織り込み済みか？メガバンク2行の動きを比較中。押し目があれば追加したいが、今はステイ。",
    tags: ["銀行株", "長期保有", "セクター分析"],
  },
  {
    id: 4,
    userId: "sample-user-uuid",
    date: "2025/12/01",
    createdAt: "2025/12/01 18:00",
    updatedAt: "2025/12/01 18:00",
    isActive: true,
    stocks: [], // 銘柄なし（市場全体など）
    content:
      "年末のアノマリーで上昇期待。新NISA資金の流入が1月以降どう影響するか。キャッシュポジションを少し多めにしておく。",
    tags: ["市場全体", "戦略"],
  },
  {
    id: 5,
    userId: "sample-user-uuid",
    date: "2025/12/12",
    createdAt: "2025/12/12 13:00",
    updatedAt: "2025/12/12 13:00",
    isActive: true,
    stocks: ["9432"],
    content:
      "25分割後の株価推移は安定的。IOWN構想の進展ニュース待ち。ディフェンシブ銘柄としてポートフォリオの土台に据えたい。",
    tags: ["通信", "長期保有"],
  },
  {
    id: 6,
    userId: "sample-user-uuid",
    date: "2025/12/08",
    createdAt: "2025/12/08 15:45",
    updatedAt: "2025/12/08 15:45",
    isActive: true,
    stocks: ["9433", "9434"],
    content:
      "通信キャリア決算比較。ARPUの底打ち感が出てきたか？楽天モバイルの黒字化動向が各社の戦略にどう影響するか引き続き監視。",
    tags: ["決算分析", "競合比較"],
  },
  {
    id: 7,
    userId: "sample-user-uuid",
    date: "2025/11/10",
    createdAt: "2025/11/10 11:20",
    updatedAt: "2025/11/10 11:20",
    isActive: true,
    stocks: ["9432"],
    content:
      "170円台での底堅さを確認。自社株買いの進捗率は順調。配当利回りが下支えしている印象。",
    tags: ["テクニカル", "需給"],
  },
  {
    id: 8,
    userId: "sample-user-uuid",
    date: "2025/10/05",
    createdAt: "2025/10/05 09:00",
    updatedAt: "2025/10/05 09:00",
    isActive: true,
    stocks: ["9433"],
    content:
      "ローソンとの連携強化によるデータビジネスの展望について調査。コンビニ来店データと通信データの掛け合わせは強力。",
    tags: ["戦略", "シナジー"],
  },
  {
    id: 9,
    userId: "sample-user-uuid",
    date: "2025/09/15",
    createdAt: "2025/09/15 14:00",
    updatedAt: "2025/09/15 14:00",
    isActive: true,
    stocks: ["9433"],
    content:
      "新料金プランの発表。ARPUへの影響は限定的と見る。競合他社への流出防止策として機能するか。",
    tags: ["サービス", "ニュース"],
  },
];
