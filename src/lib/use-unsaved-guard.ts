"use client";

import { useEffect } from "react";

const MESSAGE = "You have unsaved changes. Leave this page and lose them?";

// How many mounted editors currently have unsaved work — lets code outside the
// editor (e.g. the layout's Sign Out button) ask before discarding it.
let activeGuards = 0;

/**
 * Warn before leaving an editor with unsaved work (or mid-upload/conversion):
 * tab close/reload via `beforeunload`, and in-app navigation by intercepting
 * clicks on same-origin links (sidebar, Cancel, View Site, breadcrumbs).
 * The App Router has no navigation-blocking API, so link interception is the
 * practical option; browser Back is covered by `beforeunload` only on a hard
 * navigation.
 */
export function useUnsavedGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    activeGuards++;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers (incl. older Safari) need returnValue set.
      e.returnValue = MESSAGE;
      return MESSAGE;
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target && a.target !== "_self") return; // opens elsewhere; work survives
      if (a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase so we run before Next's <Link> click handler.
    document.addEventListener("click", onClick, true);
    return () => {
      activeGuards--;
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);
}

/** For non-link actions that leave the page (e.g. Sign Out): true = proceed. */
export function confirmLeaveIfUnsaved(): boolean {
  return activeGuards === 0 || window.confirm(MESSAGE);
}

/** Read-only: true while any mounted editor has unsaved work. */
export function hasUnsavedWork(): boolean {
  return activeGuards > 0;
}
