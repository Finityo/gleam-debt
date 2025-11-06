export async function getDebts() {
  return [
    { id: "loan1", name: "Freedom Mortgage", balance: 388828, apr: 6.25, minPayment: 2341.49, dueDay: 1, include: true },
    { id: "card1", name: "Amex Gold", balance: 2231, apr: 18.99, minPayment: 75, dueDay: 15, include: true },
  ];
}
