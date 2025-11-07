import { supabase } from "@/integrations/supabase/client";

export async function shareSnapshot(snapshot: any) {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .insert({ snapshot })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error("❌ shareSnapshot error:", e);
    throw e;
  }
}

export async function getSharedPlan(id: string) {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Plan not found');

    return {
      ...data.snapshot as any,
      createdAt: data.created_at,
    };
  } catch (e) {
    console.error("❌ getSharedPlan error:", e);
    throw e;
  }
}

export async function deleteSharedPlan(id: string) {
  try {
    const { error } = await supabase
      .from('public_shares')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("❌ deleteSharedPlan error:", e);
    throw e;
  }
}
