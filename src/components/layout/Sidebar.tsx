"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  History,
  ArrowLeftRight,
  TrendingUp,
  LineChart,
  SearchCode,
  Calendar,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  FileSpreadsheet,
  ShoppingBasket,
  Banknote,
  Repeat,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const menuItems = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { name: "取引入出金管理", href: "/cashflows", icon: Banknote },
  { name: "保有銘柄 ", href: "/holdings", icon: ArrowLeftRight },
  // { name: "取引履歴 ", href: "/trade_history", icon: History },
  { name: "銘柄別損益", href: "/round_trip_trade", icon: Repeat },
  { name: "損益推移", href: "/performance", icon: TrendingUp },
  { name: "資産推移", href: "/assets", icon: LineChart },
  { name: "監視メモ", href: "/observation_logs", icon: SearchCode },
  { name: "バスケット", href: "/baskets", icon: ShoppingBasket },
  { name: "カレンダー", href: "/calendar", icon: Calendar },
  { name: "口座管理", href: "/settings/accounts", icon: Wallet },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const { isAdmin } = useAdminCheck();

  // モバイル表示時にメニューをクリックしたらサイドバーを閉じる
  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* モバイル用メニューボタン */}
      <button
        className="md:hidden fixed bottom-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors border border-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`${
          isOpen ? "w-64" : "w-0 md:w-16"
        } bg-slate-900 text-slate-300 h-[calc(100vh-64px)] flex flex-col fixed left-0 top-16 transition-all duration-300 z-40 overflow-hidden`}
      >
        {/* 開閉ボタン */}
        <div className="flex justify-end p-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1 pt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleMenuClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                } ${!isOpen && "justify-center"}`}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon size={20} />
                {isOpen && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              {isOpen && (
                <div className="px-4 text-xs text-slate-500 mb-2">管理者</div>
              )}
              <Link
                href="/admin/fees"
                onClick={handleMenuClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/admin/fees"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
                title={!isOpen ? "証券会社・プラン" : undefined}
              >
                <Settings size={20} />
                {isOpen && (
                  <span className="whitespace-nowrap">証券会社・プラン</span>
                )}
              </Link>
              <Link
                href="/admin/jsxImport"
                onClick={handleMenuClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/admin/jsxImport"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
                title={!isOpen ? "銘柄マスタ更新" : undefined}
              >
                <FileSpreadsheet size={20} />
                {isOpen && (
                  <span className="whitespace-nowrap">銘柄マスタ更新</span>
                )}
              </Link>
            </div>
          )}
        </nav>

        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors ${
              !isOpen && "justify-center"
            }`}
          >
            <LogOut size={20} />
            {isOpen && <span className="whitespace-nowrap">ログアウト</span>}
          </button>
        </div>
      </div>
    </>
  );
}
