import ReactMarkdown from "react-markdown";

const markdownContent = `
### GMOクリック証券 CSV入手手順

1. **ログイン**  
   GMOクリック証券 にログインします。

2. **ページの遷移**  
   マイページ ＞ 精算表 ＞ 取引履歴・CSV

3. **条件設定**
   - **証券口座**：チェックを入れる
   - **入出金、その他**：チェックを入れる
   - **期間指定**：受渡日を選択し、期間を指定（例：20000101～現在）
     ※ 過去分が残っている範囲で適切に設定してください。

4. **CSVダウンロード** を実行
`;

export const GmoCsvGuide = () => (
  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm animate-in fade-in slide-in-from-top-2">
    <ReactMarkdown
      components={{
        h3: ({ ...props }) => (
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
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
        a: ({ ...props }) => (
          <a
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
      }}
    >
      {markdownContent}
    </ReactMarkdown>
  </div>
);
