"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canGoBack,
  canGoForward,
  createInitialStack,
  entryMatchesPathname,
  getCurrentEntry,
  goBackEntry,
  goForwardEntry,
  type NavEntry,
  type NavStack,
  type OnboardingStep,
  PROFILES_ENTRY,
  pushEntry,
  replaceCurrentEntry,
  seedStackForPathname,
} from "@/lib/appNavigation";

type OnboardingNavigator = {
  setStep: (step: OnboardingStep) => void;
};

type AppNavigationContextValue = {
  push: (entry: NavEntry) => void;
  replace: (entry: NavEntry) => void;
  completeTo: (entry: NavEntry) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  reset: () => void;
  registerOnboardingNavigator: (navigator: OnboardingNavigator | null) => void;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(
  null,
);

export function useAppNavigation(): AppNavigationContextValue {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used within AppNavigationProvider");
  }
  return context;
}

export function AppNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [stack, setStack] = useState<NavStack>(createInitialStack);
  const onboardingNavigatorRef = useRef<OnboardingNavigator | null>(null);
  const isApplyingRef = useRef(false);
  const stackRef = useRef(stack);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const applyEntry = useCallback(
    (entry: NavEntry) => {
      isApplyingRef.current = true;

      if (entry.kind === "route") {
        if (pathname !== entry.href) {
          router.push(entry.href);
        }
      } else if (entry.kind === "onboarding-step") {
        if (pathname !== "/onboarding") {
          router.push("/onboarding");
        }
        onboardingNavigatorRef.current?.setStep(entry.step);
      }

      requestAnimationFrame(() => {
        isApplyingRef.current = false;
      });
    },
    [pathname, router],
  );

  const registerOnboardingNavigator = useCallback(
    (navigator: OnboardingNavigator | null) => {
      onboardingNavigatorRef.current = navigator;
    },
    [],
  );

  const push = useCallback(
    (entry: NavEntry) => {
      setStack((current) => {
        const next = pushEntry(current, entry);
        applyEntry(entry);
        return next;
      });
    },
    [applyEntry],
  );

  const replace = useCallback(
    (entry: NavEntry) => {
      setStack((current) => {
        const next = replaceCurrentEntry(current, entry);
        applyEntry(entry);
        return next;
      });
    },
    [applyEntry],
  );

  const completeTo = useCallback(
    (entry: NavEntry) => {
      setStack(() => {
        const next: NavStack = { entries: [PROFILES_ENTRY, entry], index: 1 };
        applyEntry(entry);
        return next;
      });
    },
    [applyEntry],
  );

  const goBack = useCallback(() => {
    setStack((current) => {
      const next = goBackEntry(current);
      if (!next) {
        return current;
      }
      applyEntry(getCurrentEntry(next));
      return next;
    });
  }, [applyEntry]);

  const goForward = useCallback(() => {
    setStack((current) => {
      const next = goForwardEntry(current);
      if (!next) {
        return current;
      }
      applyEntry(getCurrentEntry(next));
      return next;
    });
  }, [applyEntry]);

  const reset = useCallback(() => {
    const initial = createInitialStack();
    setStack(initial);
    if (pathname !== "/") {
      router.push("/");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (isApplyingRef.current) {
      return;
    }

    const pathnameChanged = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    if (!pathnameChanged) {
      return;
    }

    const current = getCurrentEntry(stackRef.current);
    if (entryMatchesPathname(current, pathname)) {
      return;
    }

    setStack(seedStackForPathname(pathname));
  }, [pathname]);

  const value: AppNavigationContextValue = {
    push,
    replace,
    completeTo,
    goBack,
    goForward,
    canGoBack: canGoBack(stack),
    canGoForward: canGoForward(stack),
    reset,
    registerOnboardingNavigator,
  };

  return (
    <AppNavigationContext.Provider value={value}>
      {children}
    </AppNavigationContext.Provider>
  );
}
