// Minimal Identity Binding
const USER_KEY = "finityo:userId";

export function getUserId(): string {
  let uid = localStorage.getItem(USER_KEY);
  if (!uid) {
    uid = "user-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_KEY, uid);
  }
  return uid;
}

export function clearUserId(): void {
  localStorage.removeItem(USER_KEY);
}
