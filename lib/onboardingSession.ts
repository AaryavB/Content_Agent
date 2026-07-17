const USER_ID_KEY = "content-agent-onboarding-user-id";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromLocal = localStorage.getItem(USER_ID_KEY);
  if (fromLocal) {
    return fromLocal;
  }

  const fromSession = sessionStorage.getItem(USER_ID_KEY);
  if (fromSession) {
    localStorage.setItem(USER_ID_KEY, fromSession);
    sessionStorage.removeItem(USER_ID_KEY);
    return fromSession;
  }

  return null;
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
  sessionStorage.removeItem(USER_ID_KEY);
}

export function clearStoredUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
}
