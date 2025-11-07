// DB ADAPTER - Simple localStorage wrapper (replace with Lovable backend)
const STORAGE_PREFIX = "finityo:user:";

export async function dbGet(userId: string): Promise<any | null> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to load user data:", e);
    return null;
  }
}

export async function dbSet(userId: string, data: any): Promise<void> {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save user data:", e);
  }
}

export async function dbPatch(userId: string, patch: any): Promise<void> {
  const existing = await dbGet(userId);
  await dbSet(userId, { ...existing, ...patch });
}

export async function dbClear(userId: string): Promise<void> {
  localStorage.removeItem(STORAGE_PREFIX + userId);
}
