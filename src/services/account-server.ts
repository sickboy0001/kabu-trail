import { SupabaseClient } from "@supabase/supabase-js";

export const getBrokers = async (supabase: SupabaseClient) => {
  const [brokersResult, templatesResult, rulesResult] = await Promise.all([
    supabase.from("brokers").select("id, name").order("sort_order"),
    supabase
      .from("fee_templates")
      .select("id, name, sort_order, broker_id")
      .order("sort_order"),
    supabase.from("fee_rules").select("*").order("threshold_amount"),
  ]);

  if (brokersResult.error) {
    console.error(
      "Error fetching brokers:",
      JSON.stringify(brokersResult.error, null, 2)
    );
    throw brokersResult.error;
  }
  if (templatesResult.error) {
    console.error(
      "Error fetching fee_templates:",
      JSON.stringify(templatesResult.error, null, 2)
    );
    throw templatesResult.error;
  }
  if (rulesResult.error) {
    console.error(
      "Error fetching fee_rules:",
      JSON.stringify(rulesResult.error, null, 2)
    );
    throw rulesResult.error;
  }

  const data = brokersResult.data.map((broker) => ({
    ...broker,
    fee_templates: templatesResult.data
      .filter((t) => t.broker_id === broker.id)
      .map((t) => ({
        ...t,
        fee_rules:
          rulesResult.data?.filter((r) => r.template_id === t.id) || [],
      })),
  }));

  return data;
};

export const getUserAccounts = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabase
    .from("broker_accounts")
    .select(
      `
      id,
      broker_id,
      name,
      is_nisa,
      sort_order,
      template_id
    `
    )
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(
      "Error fetching broker accounts:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
  return data;
};

export const getAccountListDisplayData = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const [brokers, accountsRaw] = await Promise.all([
    getBrokers(supabase),
    getUserAccounts(supabase, userId),
  ]);

  const accounts = accountsRaw?.map((account) => {
    const broker = brokers?.find((b) => b.id === account.broker_id);
    return {
      ...account,
      brokers: broker ? { name: broker.name } : null,
    };
  });

  return { brokers, accounts };
};
