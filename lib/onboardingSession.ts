const USER_ID_KEY = "content-agent-onboarding-user-id";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: string): void {
  sessionStorage.setItem(USER_ID_KEY, userId);
}

export function clearStoredUserId(): void {
  sessionStorage.removeItem(USER_ID_KEY);
}
