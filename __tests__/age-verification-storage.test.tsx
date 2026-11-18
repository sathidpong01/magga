import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { Children, isValidElement, type ReactNode } from "react";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const state = { open: false, effects: [] as Array<() => void> };
const react = await import("react");
mock.module("react", () => ({ ...react,
  useState: () => [state.open, (value: boolean) => { state.open = value; }],
  useEffect: (effect: () => void) => { state.effects.push(effect); },
}));
const { default: AgeVerificationModal } = await import("@/app/components/features/auth/AgeVerificationModal");

function verify(node: ReactNode): boolean {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) continue;
    if (child.props.children === "ใช่" && child.props.onClick) {
      child.props.onClick(); return true;
    }
    if (verify(child.props.children)) return true;
  }
  return false;
}
beforeEach(() => {
  state.open = false; state.effects = [];
  stubGlobal("window", new EventTarget());
});
afterEach(restoreGlobals);

it.each(["method", "property", "quota"])("requires age confirmation but lets the visitor continue when storage throws: %s", failure => {
  stubGlobal("localStorage", { getItem: () => { if (failure === "method") throw new DOMException("blocked", "SecurityError"); return null; }, setItem: () => { throw new DOMException("blocked", "QuotaExceededError"); } });
  if (failure === "property") Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } });
  const verified = mock();
  window.addEventListener("magga-age-verified", verified);
  AgeVerificationModal();
  expect(() => state.effects[0]()).not.toThrow();
  expect(state.open).toBe(true);
  expect(() => expect(verify(AgeVerificationModal())).toBe(true)).not.toThrow();
  expect(state.open).toBe(false);
  expect(verified).toHaveBeenCalledTimes(1);
});

it("keeps the remembered age confirmation when storage is available", () => {
  stubGlobal("localStorage", { getItem: () => "true" });
  AgeVerificationModal();
  state.effects[0]();
  expect(state.open).toBe(false);
});
