import { z } from "zod";
import type { DebtInput } from "@/lib/debtPlan";

// ✅ Zod schema validation for debt records
const DebtSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number().min(0),
  apr: z.number().min(0).max(100),
  minPayment: z.number().min(0),
  dueDay: z.number().int().min(1).max(28).optional(),
  include: z.boolean().optional(),
  notes: z.string().optional(),
});

// ✅ Fetch debts from live backend (Lovable Cloud or Supabase)
export async function getDebts(): Promise<DebtInput[]> {
  try {
    const response = await fetch("/api/debts", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const validated = z.array(DebtSchema).parse(data) as DebtInput[];
    console.log("✅ Debts loaded:", validated.length);
    return validated;
  } catch (error) {
    console.error("❌ Failed to fetch debts:", error);
    return []; // Fallback to empty array
  }
}
