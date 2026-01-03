import { createKabuTrailServerClient } from "@/lib/supabaseServer"; // サーバー用クライアント
import { Database } from "@/types/supabase";
import BrokerList from "@/app/admin/fees/_components/BrokerList";
import RuleEditor from "@/app/admin/fees/_components/RuleEditor";

// 型定義を修正：searchParams を Promise でラップする
export default async function FeeManagementPage(props: {
  searchParams: Promise<{ brokerId?: string; templateId?: string }>;
}) {
  // ここで await して中身を取り出す
  const searchParams = await props.searchParams;
  const selectedTemplateId = searchParams.templateId;

  const supabase = await createKabuTrailServerClient();

  // 1. まず brokers を取得
  const { data: brokersRaw } = await supabase
    .from("brokers")
    .select("*")
    .order("sort_order", { ascending: true });

  // 2. 次に fee_templates を取得
  const { data: templates } = await supabase
    .from("fee_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  // 3. アプリ側でマージ（擬似的な JOIN）
  const brokers =
    brokersRaw?.map((broker) => ({
      ...broker,
      fee_templates: templates?.filter((t) => t.broker_id === broker.id) || [],
    })) || [];

  console.log("Merged Brokers:", brokers);

  // 2. 選択中のテンプレートがある場合、そのルールを取得
  let rules: Database["public"]["Tables"]["fee_rules"]["Row"][] = [];

  if (selectedTemplateId) {
    const { data } = await supabase
      .from("fee_rules")
      .select("*")
      .eq("template_id", selectedTemplateId)
      .eq("is_active", true)
      .order("threshold_amount", { ascending: true });
    if (data) rules = data;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* 左側：ナビゲーション一覧 */}
      <aside className="w-80 border-r bg-slate-50 overflow-y-auto p-4">
        <h2 className="text-lg font-bold mb-4">証券会社・プラン</h2>
        <BrokerList brokers={brokers || []} selectedId={selectedTemplateId} />
      </aside>

      {/* 右側：詳細編集エリア */}
      <main className="flex-1 overflow-y-auto p-8">
        {selectedTemplateId ? (
          <RuleEditor
            templateId={parseInt(selectedTemplateId)}
            initialRules={rules}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            左側からプランを選択するか、新規作成してください。
          </div>
        )}
      </main>
    </div>
  );
}
