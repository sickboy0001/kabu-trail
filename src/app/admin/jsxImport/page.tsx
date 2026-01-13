import StockImportClient from "@/components/pages/admin/stocks/StockImportClient";

export const metadata = {
  title: "銘柄マスタ取り込み | 管理画面",
};

export default function StockImportPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">銘柄マスタ更新</h1>
      <StockImportClient />
    </div>
  );
}
