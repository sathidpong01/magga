"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";

/** Private lists and their mutations belong to one authenticated actor. */
export function useBlockedItems<T>(endpoint: string, field: string, onCountChange?: (count: number) => void) {
  const { data: session, isPending } = useSession();
  const actor = session?.user?.id ?? null;
  const [state, setState] = useState<{ actor: string | null; items: T[]; loading: boolean; error: string }>({
    actor: null, items: [], loading: true, error: "",
  });
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = useRef(false);
  const scope = useRef<AbortController | null>(null);
  const countCallback = useRef(onCountChange);
  useEffect(() => { countCallback.current = onCountChange; }, [onCountChange]);

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    pending.current = false;
    setBusy(null);
    countCallback.current?.(0);
    setState({ actor, items: [], loading: isPending || Boolean(actor), error: "" });
    if (!isPending && actor) {
      void fetch(endpoint, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]), cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("ไม่สามารถโหลดรายการได้");
        const data = await response.json();
        if (!Array.isArray(data[field])) throw new Error("รูปแบบข้อมูลตอบกลับไม่ถูกต้อง");
        if (!controller.signal.aborted) setState({ actor, items: data[field], loading: false, error: "" });
      }).catch((error) => {
        if (!controller.signal.aborted) setState({ actor, items: [], loading: false, error: error instanceof Error ? error.message : "ไม่สามารถโหลดรายการได้" });
      });
    }
    return () => controller.abort();
  }, [actor, isPending, endpoint, field, reload]);

  useEffect(() => {
    if (state.actor === actor && !state.loading && !state.error) countCallback.current?.(state.items.length);
  }, [actor, state]);

  const mutate = useCallback(async (
    key: string, url: string, options: RequestInit, apply: (items: T[]) => T[],
  ) => {
    const controller = scope.current;
    if (pending.current || isPending || !actor || !controller || controller.signal.aborted) return false;
    pending.current = true;
    setBusy(key);
    setState((previous) => ({ ...previous, error: "" }));
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
      if (!response.ok) throw new Error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      if (controller.signal.aborted || scope.current !== controller) return false;
      setState((previous) => previous.actor === actor ? { ...previous, items: apply(previous.items) } : previous);
      return true;
    } catch (error) {
      if (!controller.signal.aborted && scope.current === controller) setState((previous) => ({ ...previous,
        error: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      }));
      return false;
    } finally {
      if (scope.current === controller) { pending.current = false; setBusy(null); }
    }
  }, [actor, isPending]);

  const belongsToActor = state.actor === actor && !isPending;
  return {
    items: belongsToActor ? state.items : [], loading: !belongsToActor || state.loading,
    error: belongsToActor ? state.error : "", busy: belongsToActor ? busy : null,
    mutate, refresh: () => setReload((value) => value + 1), actor,
  };
}
