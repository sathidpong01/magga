export const CONSENT_COOKIE = "magga_consent";
export const CONSENT_VERSION = "2";
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60;
export const CONSENT_CHANGED = "cookieConsentChanged";
export const OPEN_PRIVACY_SETTINGS = "magga-open-privacy-settings";
let settingsRequested = false;

export function openPrivacySettings() {
  settingsRequested = true;
  window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS));
}

export function consumePrivacySettingsRequest() {
  const pending = settingsRequested;
  settingsRequested = false;
  return pending;
}

export function parseConsent(value: string | undefined, now = Date.now()): boolean | null {
  if (!value) return null;
  const [version, choice, date, ...extra] = value.split(".");
  const timestamp = Number(date);
  // Allow small clock differences between the browser and the server that sets the cookie.
  if (extra.length || version !== CONSENT_VERSION || !["yes", "no"].includes(choice) ||
      !Number.isSafeInteger(timestamp) || timestamp <= 0 || timestamp > now + 5 * 60 * 1000 || now - timestamp >= CONSENT_MAX_AGE * 1000) return null;
  return choice === "yes";
}

export function consentFromCookies(cookies: string | null, now = Date.now()) {
  const value = cookies?.split(";").map(part => part.trim()).find(part => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1);
  return parseConsent(value, now);
}

export function hasStatisticsConsent() {
  try { return typeof document !== "undefined" && consentFromCookies(document.cookie) === true; }
  catch { return false; }
}
