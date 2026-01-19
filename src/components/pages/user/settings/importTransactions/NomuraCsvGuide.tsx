import ReactMarkdown from "react-markdown";

const markdownContent = `
### 野村證券 CSV入手手順

1. **ページの遷移**  
   資産状況/履歴 ＞ 取引/注文履歴 ＞ すべての取引履歴

2. **画面上の設定**
   - 基準日：約定日
   - 取引期間：任意
   - 商品区分：すべて
   - 取引区分（選択）：すべて
   - 預かり区分：すべて

3. **照会** ボタンを押下
4. **CSVダウンロード** を押下
`;

export const NomuraCsvGuide = () => (
  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm animate-in fade-in slide-in-from-top-2">
    <ReactMarkdown
      components={{
        h3: ({ ...props }) => (
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-600 rounded-full"></span>
            {props.children}
          </h3>
        ),
        ol: ({ ...props }) => (
          <ol
            className="list-decimal list-inside space-y-3 text-slate-600"
            {...props}
          />
        ),
        ul: ({ ...props }) => (
          <ul
            className="ml-5 mt-1 list-disc list-inside text-xs text-slate-500 bg-white p-2 rounded border border-slate-100 space-y-1"
            {...props}
          />
        ),
        strong: ({ ...props }) => (
          <span className="font-medium text-slate-800" {...props} />
        ),
      }}
    >
      {markdownContent}
    </ReactMarkdown>
  </div>
);
