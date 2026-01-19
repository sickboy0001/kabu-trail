import ImportTransactionsClient from "@/components/pages/user/settings/importTransactions/ImportTransactionsClient";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ImportTransactionsPage(props: Props) {
  const searchParams = await props.searchParams;
  const supabaseServer = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  const accountId =
    typeof searchParams.accountId === "string"
      ? searchParams.accountId
      : undefined;

  // const { brokers, accounts } = await getAccountListDisplayData(
  //   supabaseServer,
  //   user.id
  // );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">取引データインポート</h1>
        <div className="text-right text-sm">
          ログイン中: <span className="font-mono">{user.email}</span>
        </div>
      </div>

      <ImportTransactionsClient
        // initialAccounts={accounts || []}
        // brokers={brokers || []}
        userId={user.id}
        accountId={accountId}
      />
    </div>
  );
}
