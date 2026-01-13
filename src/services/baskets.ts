import { supabase } from "@/lib/supabase";

export type StockBasket = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StockBasketItem = {
  id: number;
  stock_basket_id: number;
  stock_code: string;
  sort_order: number;
  added_at: string;
};

export async function getBaskets(userId: string) {
  const { data, error } = await supabase
    .from("stock_baskets")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as StockBasket[];
}

export async function createBasket(basket: {
  user_id: string;
  name: string;
  description?: string;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("stock_baskets")
    .insert(basket)
    .select()
    .single();

  if (error) throw error;
  return data as StockBasket;
}

export async function updateBasket(id: number, updates: Partial<StockBasket>) {
  const { data, error } = await supabase
    .from("stock_baskets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as StockBasket;
}

export async function deleteBasket(id: number) {
  const { error } = await supabase.from("stock_baskets").delete().eq("id", id);

  if (error) throw error;
}

export async function getBasketItems(basketId: number) {
  const { data, error } = await supabase
    .from("stock_basket_items")
    .select("*")
    .eq("stock_basket_id", basketId)
    .order("sort_order", { ascending: true })
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data as StockBasketItem[];
}

export async function addBasketItem(basketId: number, stockCode: string) {
  const { data, error } = await supabase
    .from("stock_basket_items")
    .insert({
      stock_basket_id: basketId,
      stock_code: stockCode,
    })
    .select()
    .single();

  if (error) throw error;
  return data as StockBasketItem;
}

export async function removeBasketItem(itemId: number) {
  const { error } = await supabase
    .from("stock_basket_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}
