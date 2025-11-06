export async function getSettings() {
  try {
    const response = await fetch("/api/settings", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("✅ Settings loaded");
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch settings:", error);
    return { extraMonthly: 0, oneTimeExtra: 0, strategy: "snowball" };
  }
}
