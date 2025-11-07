import { supabase } from "@/integrations/supabase/client";
import { sha256Hex } from "@/lib/crypto/hash";
import type { ShareListItem } from "@/lib/share/types";

export async function shareSnapshot(snapshot: any) {
  try {
    // Handle PIN if provided
    let pinHash: string | null = null;
    if (snapshot.pin) {
      pinHash = await sha256Hex(String(snapshot.pin));
      snapshot.requiresPin = true;
      delete snapshot.pin; // Don't store plain PIN
    }

    const { data, error } = await supabase
      .from('public_shares')
      .insert({ 
        snapshot,
        expires_at: snapshot.expiresAt,
        pin_hash: pinHash,
      })
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

    // Check expiration
    if (data.expires_at) {
      const expirationDate = new Date(data.expires_at);
      if (expirationDate.getTime() < Date.now()) {
        throw new Error('Plan expired');
      }
    }

    return {
      ...data.snapshot as any,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      requiresPin: !!(data as any).pin_hash,
    };
  } catch (e) {
    console.error("❌ getSharedPlan error:", e);
    throw e;
  }
}

export async function verifyPin(id: string, pin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('pin_hash')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return false;
    if (!(data as any).pin_hash) return true; // No PIN required

    const hash = await sha256Hex(String(pin));
    return hash === (data as any).pin_hash;
  } catch (e) {
    console.error("❌ verifyPin error:", e);
    return false;
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

export async function listShares(): Promise<ShareListItem[]> {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('id, created_at, expires_at, pin_hash, snapshot')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      requiresPin: !!row.pin_hash,
      title: row.snapshot?.plan?.debtFreeDate
        ? `Plan → Debt-free ${row.snapshot.plan.debtFreeDate}`
        : "Shared Plan",
    }));
  } catch (e) {
    console.error("❌ listShares error:", e);
    return [];
  }
}
