export async function getSettings() {
  return { 
    extraMonthly: 200, 
    oneTimeExtra: 0, 
    strategy: "snowball" as const, 
    startDate: "2025-11-01" 
  };
}
