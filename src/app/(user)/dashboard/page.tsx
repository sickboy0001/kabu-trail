import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="text-right text-sm">
          ログイン中: <span className="font-mono">{user.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm">現在の総資産</p>
          <p className="text-3xl font-bold mt-2">¥--,---,---</p>
        </div>
        {/* 他のカードも同様に配置 */}
      </div>
    </div>
  );
}
