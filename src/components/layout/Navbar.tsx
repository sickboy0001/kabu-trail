"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // 管理者チェック
            try {
              const res = await fetch("/api/is-admin");
              if (res.ok) {
                const json = await res.json();
                if (mounted) setIsAdmin(Boolean(json?.isAdmin));
              }
            } catch (e) {
              console.error("Admin check failed", e);
            }
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAdmin(false);
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 h-16 bg-white border-b">
      <Link
        href="/"
        className="flex items-center gap-2 text-xl font-bold text-blue-600"
      >
        <span className="bg-blue-600 text-white p-1 rounded">KT</span>
        KabuTrail
      </Link>

      {loading ? (
        <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
      ) : user ? (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {user.email}
            </span>
            {isAdmin && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium mt-0.5">
                管理者
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ログインして管理を始める
        </Link>
      )}
    </nav>
  );
}
