import { createKabuTrailAdminClient } from "@/lib/supabaseAdmin";

export default async function DashboardPage() {
  const supabaseAdmin = createKabuTrailAdminClient();

  // auth.users から全ユーザーを取得（管理者権限が必要）
  const {
    data: { users },
    error,
  } = await supabaseAdmin.auth.admin.listUsers();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth 登録ユーザー一覧 (Admin)</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
          エラー: {error.message}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-slate-700">
                メールアドレス
              </th>
              <th className="p-4 font-semibold text-slate-700">最終ログイン</th>
              <th className="p-4 font-semibold text-slate-700">ユーザーID</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4 text-slate-500">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "未ログイン"}
                </td>
                <td className="p-4 text-xs font-mono text-slate-400">
                  {user.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
