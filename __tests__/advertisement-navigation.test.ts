import { describe, expect, mock, test } from "bun:test";
import type { MouseEvent } from "react";
import { advertisementNavigation } from "../app/components/features/ads/adNavigation";

function activation(button = 0, modifiers = {}) {
  const preventDefault = mock(() => {});
  const event = {
    button, defaultPrevented: false, currentTarget: { href: "https://first.example/" },
    preventDefault, ...modifiers,
  };
  return { event: event as unknown as MouseEvent<HTMLAnchorElement>, preventDefault };
}

describe("native advertisement activation", () => {
  test("rendering uses a stable safe href and never samples random", () => {
    const originalRandom = Math.random;
    const random = mock(() => 0.9);
    Math.random = random;
    try {
      const navigation = advertisementNavigation({ linkUrls: ["https://first.example", "https://second.example"] }, () => {});
      expect(navigation.href).toBe("https://first.example/");
      expect(random).not.toHaveBeenCalled();
    } finally { Math.random = originalRandom; }
  });

  for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { detail: 0 }]) {
    test(`primary / keyboard activation preserves native browser navigation ${JSON.stringify(modifiers)}`, () => {
      const originalRandom = Math.random;
      const random = mock(() => 0.9);
      Math.random = random;
      try {
        const track = mock(() => {});
        const navigation = advertisementNavigation({ linkUrls: ["https://first.example", "https://second.example"] }, track);
        const { event, preventDefault } = activation(0, modifiers);
        navigation.onClick(event);
        expect(event.currentTarget.href).toBe("https://second.example/");
        expect(random).toHaveBeenCalledTimes(1);
        expect(track).toHaveBeenCalledTimes(1);
        expect(preventDefault).not.toHaveBeenCalled();
      } finally { Math.random = originalRandom; }
    });
  }

  test("middle click activates once and right click never activates", () => {
    const track = mock(() => {});
    const navigation = advertisementNavigation({ linkUrl: "https://legacy.example" }, track);
    const middle = activation(1);
    navigation.onClick(middle.event);
    navigation.onAuxClick(middle.event);
    navigation.onAuxClick(activation(2).event);
    expect(track).toHaveBeenCalledTimes(1);
    expect(middle.event.currentTarget.href).toBe("https://legacy.example/");
    expect(middle.preventDefault).not.toHaveBeenCalled();
  });

  test("unsafe/empty destinations and cancelled activations cannot navigate", () => {
    const track = mock(() => {});
    for (const ad of [{ linkUrl: "javascript:alert(1)" }, { linkUrls: [] }]) {
      const navigation = advertisementNavigation(ad, track);
      const { event, preventDefault } = activation();
      expect(navigation.href).toBeUndefined();
      navigation.onClick(event);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    }
    const cancelled = activation(0, { defaultPrevented: true });
    advertisementNavigation({ linkUrl: "https://example.com" }, track).onClick(cancelled.event);
    expect(track).not.toHaveBeenCalled();
  });
});
