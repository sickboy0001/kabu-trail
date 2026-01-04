"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  History,
  PlusCircle,
  BarChart3,
  Calendar,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { name: "取引登録", href: "/trades/new", icon: PlusCircle },
  { name: "取引履歴", href: "/trades/history", icon: History },
  { name: "損益推移", href: "/analytics/charts", icon: BarChart3 },
  { name: "カレンダー", href: "/calendar", icon: Calendar },
  { name: "口座管理", href: "/settings/accounts", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/is-admin");
        const json = await res.json();
        console.log("mounted", mounted);
        if (mounted) setIsAdmin(Boolean(json?.isAdmin));
      } catch (err) {
        console.error("Failed to check admin status", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-blue-600 p-1 rounded">KT</span> KabuTrail
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="px-4 text-xs text-slate-500 mb-2">管理者</div>
            <Link
              href="/admin/fees"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === "/admin/fees"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings size={20} />
              証券会社・プラン
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          ログアウト
        </button>
      </div>
    </div>
  );
}
