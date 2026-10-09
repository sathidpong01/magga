import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { createElement, type ImgHTMLAttributes, type RefObject } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const effects: Array<() => void | (() => void)> = [];
const setState = jest.fn();
const fetchMock = jest.fn();
let pageRefs: RefObject<(HTMLDivElement | null)[]>;
let onIntersection: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void;
const observe = jest.fn();
const disconnect = jest.fn();
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (value: unknown) => [value, setState],
  useEffect: (effect: () => void | (() => void)) => { effects.push(effect); },
}));
mock.module("next/image", () => ({
  default: ({ preload, unoptimized, ...props }: ImgHTMLAttributes<HTMLImageElement> & {
    preload?: boolean; unoptimized?: boolean;
  }) => createElement("img", { ...props, "data-preload": preload, "data-unoptimized": unoptimized }),
}));
mock.module("@/app/components/ui/ReadingProgress", () => ({
  default: (props: { pageRefs: typeof pageRefs; totalPages: number }) => {
    pageRefs = props.pageRefs;
    return createElement("span", { "data-reader-progress": props.totalPages });
  },
}));

const { default: MangaReader } = await import("@/app/components/features/comments/MangaReader");

describe("manga reader with per-image comments paused", () => {
  beforeEach(() => {
    effects.length = 0;
    setState.mockClear();
    observe.mockClear();
    disconnect.mockClear();
    stubGlobal("fetch", fetchMock.mockReset());
    stubGlobal("IntersectionObserver", class {
      constructor(callback: typeof onIntersection) { onIntersection = callback; }
      observe = observe;
      disconnect = disconnect;
    });
  });
  afterEach(restoreGlobals);

  it("renders dimensioned R2 pages without a comment sidebar and tracks reading without requests", () => {
    const html = renderToStaticMarkup(createElement(MangaReader, {
      mangaId: "manga",
      mangaTitle: "เรื่องทดสอบ",
      pages: [
        { url: "https://media.example.test/one.webp", width: 800, height: 1200 },
        { url: "https://media.example.test/two.webp", width: 900, height: 1300 },
      ],
    }));
    const images = html.match(/<img\b[^>]*>/g)!;
    expect(images).toHaveLength(2);
    expect(images[0]).toContain('width="800"');
    expect(images[0]).toContain('height="1200"');
    expect(images[0]).toContain('data-preload="true"');
    expect(images[1]).toContain('loading="lazy"');
    expect(images.every((image) => image.includes('data-unoptimized="true"'))).toBe(true);
    expect(html).toContain('data-reader-progress="2"');
    expect(html).not.toContain("ความคิดเห็น");
    expect(html).not.toContain("340px");

    const firstPage = Object.create(null);
    const secondPage = Object.create(null);
    pageRefs.current = [firstPage, secondPage];
    const cleanups = effects.map((effect) => effect());
    expect(observe.mock.calls).toEqual([[firstPage], [secondPage]]);
    onIntersection([{ target: secondPage, isIntersecting: true }]);
    expect(setState).toHaveBeenCalledWith(1);
    expect(fetchMock).not.toHaveBeenCalled();
    cleanups.forEach((cleanup) => { if (cleanup) cleanup(); });
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("preserves legacy URL pages and their reserved dimensions", () => {
    const html = renderToStaticMarkup(createElement(MangaReader, {
      mangaId: "legacy",
      mangaTitle: "Legacy",
      pages: ["https://media.example.test/legacy.webp"],
    }));
    expect(html).toContain('src="https://media.example.test/legacy.webp"');
    expect(html).toContain('width="900"');
    expect(html).toContain('height="1273"');
    expect(html).toContain('alt="Page 1 of Legacy"');
    expect(html).not.toContain("ความคิดเห็น");
  });
});
