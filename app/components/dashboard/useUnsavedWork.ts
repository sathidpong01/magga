"use client";
import { useEffect, useRef, useState } from "react";

/** Only user edits mark a form dirty; initial async option hydration does not. */
export function useUnsavedWork() {
  const [dirty, setDirty] = useState(false),
    dirtyRef = useRef(false);
  const message =
    "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?";
  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };
  const markSaved = () => {
    dirtyRef.current = false;
    setDirty(false);
  };
  const confirmLeave = () => !dirtyRef.current || window.confirm(message);
  useEffect(() => {
    const href = location.href,
      state = history.state;
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      if (
        !dirtyRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.href === location.href ||
        (new URL(link.href).pathname === location.pathname &&
          new URL(link.href).search === location.search)
      )
        return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        dirtyRef.current = false;
      }
    };
    const pop = (event: PopStateEvent) => {
      if (dirtyRef.current && !window.confirm(message)) {
        // Keep the mounted form intact before AppRouter consumes the traversal.
        event.stopImmediatePropagation();
        history.pushState(state, "", href);
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, []);
  return { dirty, markDirty, markSaved, confirmLeave };
}
