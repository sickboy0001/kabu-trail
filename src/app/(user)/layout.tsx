import Sidebar from "@/components/layout/Sidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900">
      {/* サイドバー */}
      <Sidebar />

      {/* メインコンテンツエリア (サイドバーの幅 64分をずらす) */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
