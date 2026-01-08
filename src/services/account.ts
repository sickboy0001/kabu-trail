import { supabase } from "@/lib/supabase";

export type AccountPayload = {
  user_id: string;
  broker_id: number;
  name: string;
  is_nisa: boolean;
  template_id?: number | null;
  sort_order?: number;
};

export const insertAccount = async (payload: AccountPayload) => {
  const { error } = await supabase.from("broker_accounts").insert(payload);
  if (error) throw error;
};

export const updateAccount = async (
  id: number,
  payload: Partial<AccountPayload>
) => {
  const { error } = await supabase
    .from("broker_accounts")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
};

export const deleteAccount = async (id: number) => {
  const { error } = await supabase
    .from("broker_accounts")
    .delete()
    .eq("id", id);
  if (error) throw error;
};
