import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { Children, isValidElement, type ReactNode } from "react";

const state = { values: [] as unknown[], index: 0, effects: [] as Array<() => void | (() => void)>, admin: false, pathname: "/test-manga" };
const environment: Record<string, string | undefined> = process.env;
const originalEnvironment = { node: environment.NODE_ENV, lighthouse: environment.NEXT_PUBLIC_LIGHTHOUSE_TESTING };
const cleanup = mock();
const install = mock<(callback: (active: boolean) => void) => () => void>(() => cleanup);
const react = await import("react");
mock.module("react", () => ({ ...react,
  useState: (initial: unknown) => {
    const index = state.index++;
    if (!(index in state.values)) state.values[index] = initial;
    return [state.values[index], (value: unknown) => { state.values[index] = value; }];
  },
  useEffect: (effect: () => void | (() => void)) => { state.effects.push(effect); },
}));
mock.module("next/navigation", () => ({ usePathname: () => state.pathname }));
mock.module("@/lib/auth-client", () => ({ useSession: () => ({ data: null }), isAdminRole: () => state.admin }));
mock.module("@/lib/reader-protection", () => ({ installReaderProtection: install }));
const { default: DevToolsProtection } = await import("@/app/components/security/DevToolsProtection");

function render() { state.index = 0; return DevToolsProtection(); }
function closeNotice(node: ReactNode): boolean {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) continue;
    if (child.props.children === "ปิดข้อความ" && child.props.onClick) { child.props.onClick(); return true; }
    if (closeNotice(child.props.children)) return true;
  }
  return false;
}

beforeEach(() => {
  state.values = []; state.index = 0; state.effects = []; state.admin = false; state.pathname = "/test-manga";
  environment.NODE_ENV = "production";
  delete environment.NEXT_PUBLIC_LIGHTHOUSE_TESTING;
  install.mockClear(); cleanup.mockClear();
});
afterEach(() => {
  if (originalEnvironment.node === undefined) delete environment.NODE_ENV;
  else environment.NODE_ENV = originalEnvironment.node;
  if (originalEnvironment.lighthouse === undefined) delete environment.NEXT_PUBLIC_LIGHTHOUSE_TESTING;
  else environment.NEXT_PUBLIC_LIGHTHOUSE_TESTING = originalEnvironment.lighthouse;
});

it("uses a dismissible portal reminder instead of a denial screen and can clear it", () => {
  expect(render()).toBeNull();
  const dispose = state.effects[0]();
  install.mock.calls[0][0](true);
  const notice = render();
  expect(notice).not.toBeNull();
  expect(closeNotice(notice)).toBe(true);
  expect(render()).toBeNull();
  install.mock.calls[0][0](false);
  expect(render()).toBeNull();
  install.mock.calls[0][0](true);
  expect(render()).not.toBeNull();
  if (typeof dispose === "function") dispose();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it.each(["admin", "development", "lighthouse"])("preserves the %s runtime exemption", exemption => {
  if (exemption === "admin") state.admin = true;
  if (exemption === "development") environment.NODE_ENV = "development";
  if (exemption === "lighthouse") environment.NEXT_PUBLIC_LIGHTHOUSE_TESTING = "true";
  expect(render()).toBeNull();
  state.effects[0]();
  expect(install).not.toHaveBeenCalled();
});

it("disposes the previous route's subscription before replacing it", () => {
  render();
  const dispose = state.effects[0]();
  if (typeof dispose === "function") dispose();
  state.pathname = "/another-manga";
  state.effects = [];
  render();
  const nextDispose = state.effects[0]();
  expect(install).toHaveBeenCalledTimes(2);
  expect(cleanup).toHaveBeenCalledTimes(1);
  if (typeof nextDispose === "function") nextDispose();
  expect(cleanup).toHaveBeenCalledTimes(2);
});
