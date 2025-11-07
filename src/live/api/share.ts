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

    return data.snapshot as any;
  } catch (e) {
    console.error("❌ getSharedPlan error:", e);
    throw e;
  }
}
