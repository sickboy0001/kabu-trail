"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900">
      {/* サイドバー */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* モバイル用バックドロップ (サイドバーが開いている時) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* メインコンテンツエリア (サイドバーの幅 64分をずらす) */}
      <main
        className={`flex-1 p-4 md:p-8 transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-16"
        }`}
      >
        <div className="max-w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
