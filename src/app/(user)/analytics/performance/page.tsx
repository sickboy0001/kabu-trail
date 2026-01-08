import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import AccountListClient from "@/components/pages/user/settings/accounts/AccountListClient";
import { getAccountListDisplayData } from "@/services/account-server";

export default async function AccountPage() {
  const supabaseServer = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  const { brokers, accounts } = await getAccountListDisplayData(
    supabaseServer,
    user.id
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">パフォーマンス</h1>
      </div>
    </div>
  );
}
