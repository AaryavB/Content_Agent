export type AppRoute = "/" | "/dashboard" | "/onboarding";

export type OnboardingStep = 1 | 2 | 3 | 4;

export type NavEntry =
  | { kind: "route"; href: AppRoute }
  | { kind: "onboarding-step"; step: OnboardingStep };

export type NavStack = {
  entries: NavEntry[];
  index: number;
};

export const PROFILES_ENTRY: NavEntry = { kind: "route", href: "/" };

export function createInitialStack(): NavStack {
  return { entries: [PROFILES_ENTRY], index: 0 };
}

export function canGoBack(stack: NavStack): boolean {
  return stack.index > 0;
}

export function canGoForward(stack: NavStack): boolean {
  return stack.index < stack.entries.length - 1;
}

export function getCurrentEntry(stack: NavStack): NavEntry {
  return stack.entries[stack.index];
}

export function pushEntry(stack: NavStack, entry: NavEntry): NavStack {
  const entries = stack.entries.slice(0, stack.index + 1);
  entries.push(entry);
  return { entries, index: entries.length - 1 };
}

export function replaceCurrentEntry(stack: NavStack, entry: NavEntry): NavStack {
  const entries = stack.entries.slice(0, stack.index);
  entries.push(entry);
  return { entries, index: entries.length - 1 };
}

export function goBackEntry(stack: NavStack): NavStack | null {
  if (!canGoBack(stack)) {
    return null;
  }
  return { ...stack, index: stack.index - 1 };
}

export function goForwardEntry(stack: NavStack): NavStack | null {
  if (!canGoForward(stack)) {
    return null;
  }
  return { ...stack, index: stack.index + 1 };
}

export function entriesEqual(a: NavEntry, b: NavEntry): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === "route" && b.kind === "route") {
    return a.href === b.href;
  }
  if (a.kind === "onboarding-step" && b.kind === "onboarding-step") {
    return a.step === b.step;
  }
  return false;
}

export function seedStackForPathname(pathname: string): NavStack {
  if (pathname === "/dashboard") {
    return {
      entries: [PROFILES_ENTRY, { kind: "route", href: "/dashboard" }],
      index: 1,
    };
  }

  if (pathname === "/onboarding") {
    return {
      entries: [PROFILES_ENTRY, { kind: "onboarding-step", step: 1 }],
      index: 1,
    };
  }

  return createInitialStack();
}

export function entryMatchesPathname(
  entry: NavEntry,
  pathname: string,
): boolean {
  if (pathname === "/") {
    return entry.kind === "route" && entry.href === "/";
  }

  if (pathname === "/dashboard") {
    return entry.kind === "route" && entry.href === "/dashboard";
  }

  if (pathname === "/onboarding") {
    return entry.kind === "onboarding-step";
  }

  return false;
}
