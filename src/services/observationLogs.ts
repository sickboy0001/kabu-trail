import { supabase } from "@/lib/supabase";

export type ObservationLogPayload = {
  user_id: string;
  date: string;
  content: string;
  stocks: string[];
  tags: string[];
  is_active?: boolean;
};

export const getObservationLogs = async (userId: string) => {
  const { data, error } = await supabase
    .from("observation_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching observation logs:", error);
    throw error;
  }
  return data;
};

export const insertObservationLog = async (payload: ObservationLogPayload) => {
  const { data, error } = await supabase
    .from("observation_logs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error inserting observation log:", error);
    throw error;
  }
  return data;
};

export const updateObservationLog = async (
  id: number,
  payload: Partial<ObservationLogPayload>
) => {
  const { data, error } = await supabase
    .from("observation_logs")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating observation log:", error);
    throw error;
  }
  return data;
};
