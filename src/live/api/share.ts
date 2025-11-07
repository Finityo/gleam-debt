import { supabase } from "@/integrations/supabase/client";

export async function shareSnapshot(snapshot: any) {
  try {
    const { data, error } = await supabase.functions.invoke('share-plan', {
      body: snapshot,
    });

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
      .from('shared_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_shared_plan_views', { p_plan_id: id });

    return data;
  } catch (e) {
    console.error("❌ getSharedPlan error:", e);
    throw e;
  }
}
