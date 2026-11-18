import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { HTMLElement, Node as HtmlNode, parse } from "node-html-parser";
import { installReaderProtection } from "@/lib/reader-protection";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const desktopAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/157.0.0.0 Safari/537.36";
const mobileAgents = [
  ["Brave Android", "Mozilla/5.0 (Linux; Android 10; K) Chrome/157.0.0.0 Mobile Safari/537.36"],
  ["Safari iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1"],
  ["Chrome iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/140.0 Mobile/15E148 Safari/604.1"],
  ["Firefox Android", "Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0"],
  ["Samsung Internet", "Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/136.0 Mobile Safari/537.36"],
  ["Facebook", "FBAN/FBIOS;FBAV/500.0"],
  ["Messenger", "FBAN/MessengerForiOS;FBAV/500.0"],
  ["Instagram", "Instagram 350.0"],
  ["LINE", "Line/15.0"],
  ["TikTok", "TikTok 40.0"],
  ["WeChat", "MicroMessenger/8.0"],
  ["Android WebView", "Mozilla/5.0 (Linux; Android 15; wv) Chrome/140.0 Mobile Safari/537.36"],
  ["Desktop app WebView", "Mozilla/5.0 Electron/38.0 Chrome/140.0"],
];
let dom: HTMLElement;
let coarse = false;
let fine = true;
let hover = true;
let focused = true;
let cleanup: (() => void) | undefined;
const hint = jest.fn<(active: boolean) => void>();
const coarseQuery = new EventTarget();

function start() { cleanup = installReaderProtection(hint); }
function resize(dimensions: Partial<Pick<Window, "outerWidth" | "innerWidth" | "outerHeight" | "innerHeight">>) {
  Object.assign(window, dimensions);
  window.dispatchEvent(new Event("resize"));
}
function dispatch(type: string, selector = "#page", extra = {}) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, "target", { value: dom.querySelector(selector) });
  Object.assign(event, extra);
  document.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  jest.useFakeTimers();
  hint.mockClear();
  coarse = false; fine = true; hover = true; focused = true;
  cleanup = undefined;
  dom = parse('<main id="outside"><section data-magga-reader><img id="page" data-magga-protected-image><span id="text">Reader title</span><input id="input"><textarea id="textarea"></textarea><select id="select"></select><div contenteditable="true"><span id="editor">Editable</span></div><div role="textbox"><span id="textbox">Editable</span></div><div data-magga-allow-copy><img id="allowed-image" data-magga-protected-image></div><button id="button">Retry</button><a id="link" href="/">Home</a></section><img id="cover"></main>');
  stubGlobal("Element", HTMLElement);
  stubGlobal("Node", HtmlNode);
  stubGlobal("navigator", { userAgent: desktopAgent, maxTouchPoints: 0, language: "th" });
  stubGlobal("window", Object.assign(new EventTarget(), {
    outerWidth: 1280, innerWidth: 1280, outerHeight: 900, innerHeight: 800,
    visualViewport: { scale: 1 }, getSelection: () => null,
    matchMedia: (query: string) => {
      if (query === "(any-pointer: coarse)") {
        Object.defineProperty(coarseQuery, "matches", { configurable: true, get: () => coarse });
        return coarseQuery;
      }
      return { matches: query === "(pointer: fine)" ? fine : hover };
    },
  }));
  stubGlobal("document", Object.assign(new EventTarget(), {
    visibilityState: "visible", hasFocus: () => focused,
    querySelector: (selector: string) => dom.querySelector(selector),
    querySelectorAll: (selector: string) => dom.querySelectorAll(selector),
  }));
});
afterEach(() => { cleanup?.(); jest.useRealTimers(); restoreGlobals(); });

describe("mobile and embedded browser false positives", () => {
  it.each(mobileAgents)("does not schedule geometry polling for %s", (_name, userAgent) => {
    Object.assign(navigator, { userAgent });
    resize({ outerWidth: 384, innerWidth: 384, outerHeight: 832, innerHeight: 632 });
    start();
    for (const innerHeight of [632, 320, 732, 184]) {
      resize({ innerHeight });
      jest.advanceTimersByTime(5000);
    }
    expect(hint).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([
    { maxTouchPoints: 5 }, // iPad desktop UA, foldables, touch laptops and mobile desktop-site mode
    { maxTouchPoints: 0, userAgentData: { mobile: true } },
  ])("uses capabilities even with a desktop User Agent: %j", device => {
    Object.assign(navigator, device);
    resize({ innerHeight: 300 });
    start();
    jest.advanceTimersByTime(5000);
    expect(jest.getTimerCount()).toBe(0);
    expect(hint).not.toHaveBeenCalled();
  });

  it.each(["coarse", "no fine pointer", "no hover", "missing API", "throwing API"])("keeps unknown/limited browsers readable: %s", capability => {
    if (capability === "coarse") coarse = true;
    if (capability === "no fine pointer") fine = false;
    if (capability === "no hover") hover = false;
    if (capability === "missing API") Object.assign(window, { matchMedia: undefined });
    if (capability === "throwing API") Object.assign(window, { matchMedia: () => { throw new Error("unsupported"); } });
    start();
    jest.advanceTimersByTime(5000);
    expect(jest.getTimerCount()).toBe(0);
    expect(hint).not.toHaveBeenCalled();
  });
});

describe("scoped image deterrents", () => {
  it.each(["contextmenu", "dragstart", "copy"])("prevents %s on reader images only", type => {
    start();
    expect(dispatch(type).defaultPrevented).toBe(true);
    for (const selector of ["#outside", "#text", "#cover", "#input", "#textarea", "#select", "#editor", "#textbox", "#button", "#link", "#allowed-image"]) {
      expect(dispatch(type, selector).defaultPrevented).toBe(false);
    }
  });

  it("protects an image in a selection while allowing ordinary text and editable selections", () => {
    start();
    Object.assign(window, { getSelection: () => ({ isCollapsed: false, containsNode: (node: unknown) => node === dom.querySelector("#page") }) });
    expect(dispatch("copy", "#outside").defaultPrevented).toBe(true);
    expect(dispatch("copy", "#editor").defaultPrevented).toBe(false);
    Object.assign(window, { getSelection: () => ({ isCollapsed: false, containsNode: () => false }) });
    expect(dispatch("copy", "#text").defaultPrevented).toBe(false);
    Object.assign(window, { getSelection: () => ({ isCollapsed: false, containsNode: (node: unknown) => node === dom.querySelector("#allowed-image") }) });
    expect(dispatch("copy", "#outside").defaultPrevented).toBe(false);
  });

  it.each([
    { key: "F12" }, { key: "i", ctrlKey: true, shiftKey: true },
    { key: "J", ctrlKey: true, shiftKey: true }, { key: "c", ctrlKey: true, shiftKey: true },
    { key: "i", metaKey: true, altKey: true }, { key: "J", metaKey: true, altKey: true },
    { key: "C", metaKey: true, altKey: true }, { key: "u", ctrlKey: true },
    { key: "U", metaKey: true }, { key: "s", ctrlKey: true }, { key: "S", metaKey: true },
  ])("handles a shortcut without claiming that DevTools opened: %j", keys => {
    start();
    expect(dispatch("keydown", "#outside", keys).defaultPrevented).toBe(true);
    expect(dispatch("keydown", "#editor", keys).defaultPrevented).toBe(false);
    expect(hint).not.toHaveBeenCalled();
  });

  it("leaves selection, printing, zoom, composition and touch gestures available", () => {
    start();
    for (const keys of [{ key: "a", ctrlKey: true }, { key: "p", metaKey: true }, { key: "+", ctrlKey: true }, { key: "i", ctrlKey: true, shiftKey: true, isComposing: true }]) {
      expect(dispatch("keydown", "#outside", keys).defaultPrevented).toBe(false);
    }
    for (const type of ["touchstart", "touchmove", "pointerdown", "wheel"]) expect(dispatch(type).defaultPrevented).toBe(false);
  });

  it("does not intercept shortcuts on search, policy, account or admin pages without a reader", () => {
    dom = parse('<main id="outside"></main>');
    start();
    expect(dispatch("keydown", "#outside", { key: "F12" }).defaultPrevented).toBe(false);
    resize({ innerHeight: 300 });
    jest.advanceTimersByTime(5000);
    expect(hint).not.toHaveBeenCalled();
  });
});

describe("desktop advisory lifecycle", () => {
  it.each([{ innerWidth: 900 }, { innerHeight: 400 }])("confirms stable geometry and clears the hint after recovery: %j", dimensions => {
    resize(dimensions);
    start();
    jest.advanceTimersByTime(500);
    expect(hint).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(hint.mock.calls).toEqual([[true]]);
    jest.advanceTimersByTime(5000);
    expect(hint).toHaveBeenCalledTimes(1);
    resize({ innerWidth: 1280, innerHeight: 800 });
    expect(hint.mock.calls).toEqual([[true], [false]]);
  });

  it("does not accumulate rapid resizes or pinch zoom into a detection", () => {
    start();
    resize({ innerWidth: 900 });
    jest.advanceTimersByTime(500);
    resize({ innerWidth: 850 });
    jest.advanceTimersByTime(500);
    expect(hint).not.toHaveBeenCalled();
    Object.assign(window.visualViewport!, { scale: 2 });
    jest.advanceTimersByTime(5000);
    expect(hint).not.toHaveBeenCalled();
  });

  it.each([["blur", "focus"], ["pagehide", "pageshow"]])("pauses on %s and resumes once on %s", (pause, resume) => {
    resize({ innerHeight: 300 });
    start();
    jest.advanceTimersByTime(500);
    window.dispatchEvent(new Event(pause));
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(5000);
    window.dispatchEvent(new Event(resume));
    window.dispatchEvent(new Event(resume));
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(500);
    expect(hint).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(hint.mock.calls).toEqual([[true]]);
  });

  it("pauses hidden/unfocused tabs and responds to changing input capabilities", () => {
    start();
    Object.assign(document, { visibilityState: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(jest.getTimerCount()).toBe(0);
    Object.assign(document, { visibilityState: "visible" });
    focused = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(jest.getTimerCount()).toBe(0);
    focused = true;
    window.dispatchEvent(new Event("focus"));
    expect(jest.getTimerCount()).toBe(1);
    coarse = true;
    coarseQuery.dispatchEvent(new Event("change"));
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cleans up after route changes/unmount and installs exactly one replacement", () => {
    start();
    cleanup?.();
    expect(jest.getTimerCount()).toBe(0);
    expect(dispatch("contextmenu").defaultPrevented).toBe(false);
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("pageshow"));
    expect(jest.getTimerCount()).toBe(0);
    start();
    expect(jest.getTimerCount()).toBe(1);
    expect(dispatch("contextmenu").defaultPrevented).toBe(true);
  });
});
