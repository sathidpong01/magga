import type { MouseEvent } from "react";
import { chooseAdvertisementLink, getAdvertisementLinks } from "@/lib/advertisements";

type LinkAdvertisement = { linkUrl?: string | null; linkUrls?: string[] | null };

/** Keep native anchor activation (including Enter and modifier keys) as the only navigation. */
export function advertisementNavigation(ad: LinkAdvertisement, onActivate: () => void) {
  const activate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    const destination = chooseAdvertisementLink(ad);
    if (!destination) {
      event.preventDefault();
      return;
    }
    // The browser reads this synchronously after the event; no window.open or second navigation.
    event.currentTarget.href = destination;
    onActivate();
  };
  return {
    href: getAdvertisementLinks(ad)[0],
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button === 0) activate(event);
    },
    onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button === 1) activate(event);
    },
  };
}
