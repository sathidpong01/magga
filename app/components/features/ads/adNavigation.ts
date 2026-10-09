import type { MouseEvent } from "react";
import { getAdvertisementLinks } from "@/lib/advertisements";

type LinkAdvertisement = { linkUrl?: string | null; linkUrls?: string[] | null };

/** Keep native anchor activation (including Enter and modifier keys) as the only navigation. */
export function advertisementNavigation(ad: LinkAdvertisement, onActivate: () => void) {
  const destination = getAdvertisementLinks(ad)[0];
  const activate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (!destination) {
      event.preventDefault();
      return;
    }
    onActivate();
  };
  return {
    href: destination,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button === 0) activate(event);
    },
    onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button === 1) activate(event);
    },
  };
}
