/** Client-side reading deterrents, not an access-control boundary. */
const readerSelector = "[data-magga-reader]";
const imageSelector = "img[data-magga-protected-image]";
const editableSelector = 'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"]), [data-magga-allow-copy]';

function targetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  return target instanceof Node ? target.parentElement : null;
}

/** Uses positive pointer capabilities; an unknown environment remains readable. */
function desktopWindowSizeIsUsable(): boolean {
  const hints = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (
    hints.userAgentData?.mobile || navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|Electron|\bwv\b/i.test(navigator.userAgent)
  ) return false;
  try {
    return window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches &&
      !window.matchMedia("(any-pointer: coarse)").matches;
  } catch {
    return false;
  }
}

export function installReaderProtection(onWindowSizeHint: (active: boolean) => void): () => void {
  const inReader = () => document.querySelector(readerSelector) !== null;
  const isEditable = (element: Element | null) => element?.closest(editableSelector) != null;
  const isProtectedImage = (element: Element | null) => element?.closest(imageSelector) != null;

  const preventImageAction = (event: Event) => {
    const element = targetElement(event.target);
    if (!isEditable(element) && isProtectedImage(element)) event.preventDefault();
  };
  const handleCopy = (event: ClipboardEvent) => {
    const element = targetElement(event.target);
    if (isEditable(element)) return;
    if (isProtectedImage(element)) {
      event.preventDefault();
      return;
    }
    const selection = window.getSelection?.();
    if (!selection || selection.isCollapsed) return;
    for (const image of document.querySelectorAll(imageSelector)) {
      if (!isEditable(image) && selection.containsNode(image, true)) {
        event.preventDefault();
        return;
      }
    }
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || isEditable(targetElement(event.target)) || !inReader()) return;
    const key = event.key.toLowerCase();
    const inspector = (event.ctrlKey && event.shiftKey) || (event.metaKey && event.altKey);
    const sourceOrSave = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && (key === "u" || key === "s");
    if (key === "f12" || (inspector && ["i", "j", "c"].includes(key)) || sourceOrSave) {
      // A shortcut expresses intent; it does not prove DevTools opened.
      event.preventDefault();
    }
  };

  let interval: ReturnType<typeof setInterval> | undefined;
  let candidateSince: number | undefined;
  let candidateGeometry = "";
  let hintActive = false;
  let suspended = false;
  const setHint = (active: boolean) => {
    if (hintActive === active) return;
    hintActive = active;
    onWindowSizeHint(active);
  };
  const resetCandidate = () => {
    candidateSince = undefined;
    candidateGeometry = "";
    setHint(false);
  };
  const stopMonitoring = () => {
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
    resetCandidate();
  };
  const checkWindowSize = () => {
    const { outerWidth, innerWidth, outerHeight, innerHeight } = window;
    if (
      !inReader() || Math.abs((window.visualViewport?.scale ?? 1) - 1) > 0.001 ||
      ![outerWidth, innerWidth, outerHeight, innerHeight].every(size => Number.isFinite(size) && size > 0) ||
      (outerWidth - innerWidth <= 160 && outerHeight - innerHeight <= 160)
    ) {
      resetCandidate();
      return;
    }
    const geometry = `${outerWidth}:${innerWidth}:${outerHeight}:${innerHeight}`;
    if (candidateSince === undefined || geometry !== candidateGeometry) {
      candidateSince = Date.now();
      candidateGeometry = geometry;
    } else if (Date.now() - candidateSince >= 1000) {
      // Geometry is ambiguous. The caller may show a dismissible reminder only.
      setHint(true);
    }
  };
  const reconcileMonitoring = () => {
    resetCandidate();
    if (suspended || document.visibilityState !== "visible" || document.hasFocus?.() !== true || !desktopWindowSizeIsUsable()) {
      stopMonitoring();
    } else {
      if (interval === undefined) interval = setInterval(checkWindowSize, 500);
      checkWindowSize();
    }
  };
  const suspend = () => { suspended = true; stopMonitoring(); };
  const resume = () => { suspended = false; reconcileMonitoring(); };

  document.addEventListener("contextmenu", preventImageAction);
  document.addEventListener("dragstart", preventImageAction);
  document.addEventListener("copy", handleCopy);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("visibilitychange", reconcileMonitoring);
  window.addEventListener("resize", reconcileMonitoring);
  window.addEventListener("blur", suspend);
  window.addEventListener("focus", resume);
  window.addEventListener("pagehide", suspend);
  window.addEventListener("pageshow", resume);
  let pointer: MediaQueryList | undefined;
  try { pointer = window.matchMedia?.("(any-pointer: coarse)"); } catch { /* Unsupported environment: no size monitoring. */ }
  pointer?.addEventListener?.("change", reconcileMonitoring);
  reconcileMonitoring();

  return () => {
    stopMonitoring();
    document.removeEventListener("contextmenu", preventImageAction);
    document.removeEventListener("dragstart", preventImageAction);
    document.removeEventListener("copy", handleCopy);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("visibilitychange", reconcileMonitoring);
    window.removeEventListener("resize", reconcileMonitoring);
    window.removeEventListener("blur", suspend);
    window.removeEventListener("focus", resume);
    window.removeEventListener("pagehide", suspend);
    window.removeEventListener("pageshow", resume);
    pointer?.removeEventListener?.("change", reconcileMonitoring);
  };
}
