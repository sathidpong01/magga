import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { Children, isValidElement, type ReactNode } from "react";
import { restoreGlobals, stubGlobal } from "./helpers/globals";
import { POST } from "@/app/api/privacy/consent/route";
import { OPEN_PRIVACY_SETTINGS } from "@/lib/privacy-consent";

const state: { values: unknown[]; index: number } = { values: [], index: 0 };
const effects: Array<() => () => void> = [];
const react = await import("react");
mock.module("react", () => ({ ...react,
  useState: (initial: unknown) => {
    const index = state.index++;
    state.values[index] = index === 0 ? true : initial;
    return [state.values[index], (value: unknown) => { state.values[index] = value; }];
  },
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => () => void) => { effects.push(effect); },
}));
const { default: CookieConsent } = await import("@/app/components/features/auth/CookieConsent");

function clickChoice(node: ReactNode, label: string): boolean {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void; "aria-label"?: string }>(child)) continue;
    if ((child.props.children === label || child.props["aria-label"] === label) && child.props.onClick) {
      child.props.onClick();
      return true;
    }
    if (clickChoice(child.props.children, label)) return true;
  }
  return false;
}

beforeEach(() => {
  state.index = 0;
  state.values = [];
  effects.length = 0;
  stubGlobal("document", { cookie: "" });
  stubGlobal("localStorage", { removeItem: () => {}, setItem: () => {} });
  stubGlobal("window", Object.assign(new EventTarget(), { location: { reload: mock() } }));
});
afterEach(restoreGlobals);

it("dismisses the banner without saving consent or sending a request", () => {
  const fetch = mock();
  stubGlobal("fetch", fetch);
  expect(clickChoice(CookieConsent(), "ปิดการตั้งค่าความเป็นส่วนตัว")).toBe(true);
  expect(state.values[0]).toBe(false);
  expect(state.values[2]).toBe("");
  expect(fetch).not.toHaveBeenCalled();
  expect(document.cookie).toBe("");
});

it("stays dismissed on pending timers and focus but allows reopening from the footer", () => {
  const timers: Array<() => void> = [];
  const schedule = mock((callback: () => void) => { timers.push(callback); return 1; });
  stubGlobal("setTimeout", schedule);
  stubGlobal("clearTimeout", mock());
  stubGlobal("localStorage", { getItem: () => "true" });
  stubGlobal("HTMLElement", class {});
  stubGlobal("requestAnimationFrame", mock());
  Object.assign(window, { setInterval: schedule, clearInterval: mock() });
  const banner = CookieConsent();
  const cleanup = effects[0]();
  expect(clickChoice(banner, "ปิดการตั้งค่าความเป็นส่วนตัว")).toBe(true);
  for (const callback of timers) callback();
  window.dispatchEvent(new Event("focus"));
  expect(state.values[0]).toBe(false);
  window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS));
  expect(state.values[0]).toBe(true);
  cleanup();
});

async function choose(label = "ใช้เฉพาะที่จำเป็น") {
  expect(clickChoice(CookieConsent(), label)).toBe(true);
  await new Promise(resolve => setImmediate(resolve));
  expect(state.values[1]).toBe(false);
}

it.each([
  { label: "ใช้เฉพาะที่จำเป็น", statistics: false },
  { label: "อนุญาตคุกกี้วัดผล", statistics: true },
])("closes the banner after saving $label through the real consent route", async ({ label, statistics }) => {
  stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    expect(JSON.parse(String(init.body))).toEqual({ statistics });
    const response = await POST(new Request("http://localhost/api/privacy/consent", {
      ...init, headers: { ...init.headers, origin: "http://localhost" },
    }));
    document.cookie = response.headers.getSetCookie().find(value => value.startsWith("magga_consent=")) ?? "";
    return response;
  });
  await choose(label);
  expect(state.values[0]).toBe(false);
  expect(state.values[2]).toBe("");
});

it("explains blocked cookies when a successful response cannot persist the choice", async () => {
  stubGlobal("fetch", async () => Response.json({ saved: true }));
  await choose();
  expect(state.values[0]).toBe(true);
  expect(state.values[2]).toBe("บันทึกตัวเลือกไม่สำเร็จ กรุณาเปิดใช้งานคุกกี้ในเบราว์เซอร์แล้วลองใหม่อีกครั้ง");
});

it.each(["http", "network"])("keeps the banner open without blaming cookies on a %s failure", async failure => {
  stubGlobal("fetch", async () => {
    if (failure === "network") throw new TypeError("Failed to fetch");
    return new Response(null, { status: 403 });
  });
  await choose();
  expect(state.values[0]).toBe(true);
  expect(state.values[2]).toBe("บันทึกตัวเลือกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
});
