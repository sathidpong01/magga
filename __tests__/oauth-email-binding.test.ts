import { expect, it, jest, mock } from "bun:test";
import type { BetterAuthOptions } from "better-auth";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

let options: BetterAuthOptions = {};
mock.module("@/db", () => ({ db: {}, schema: {} }));
mock.module("better-auth/adapters/drizzle", () => ({ drizzleAdapter: () => ({}) }));
mock.module("better-auth", () => ({ betterAuth: (value: BetterAuthOptions) => { options = value; return {}; } }));
await import("@/lib/auth");
// Exercise the installed linking implementation with the application's real configuration.
const moduleUrl = pathToFileURL(resolve("node_modules/better-auth/dist/oauth2/link-account.mjs")).href;
const { handleOAuthUserInfo, linkOAuthAccount } = await import(moduleUrl);
const user = { id: "existing", email: "victim@example.test", emailVerified: true };
const account = { id: "attacker-account", providerId: "google", accountId: "attacker", userId: user.id };
const createAccount = jest.fn(async () => ({ id: "explicit-account" }));
const linkAccount = jest.fn();
const context = {
  options, trustedProviders: [], socialProviders: [{ id: "google", options: {} }],
  logger: { warn: () => {}, error: () => {} },
  internalAdapter: {
    findAccountOwnerByKey: async ({ accountId }: { accountId: string }) => accountId === "attacker" ? { kind: "owned", user, account } : null,
    findUserByEmail: async () => ({ user, accounts: [account] }),
    updateAccount: async () => account,
    createSession: async () => ({ id: "session", userId: user.id }),
    findAccountByKey: async () => null,
    createAccount, linkAccount,
  },
};

it("legacy verified-email collisions cannot implicitly attach a new Google identity", async () => {
  const result = await handleOAuthUserInfo({ context }, {
    userInfo: { ...user, id: "victim-google-id" }, account: { providerId: "google", accountId: "victim-google-id" },
  });
  expect(result.error).toBe("account not linked");
  expect(linkAccount).not.toHaveBeenCalled();
});

it("already-linked provider-ID login and explicitly authenticated linking remain supported", async () => {
  const result = await handleOAuthUserInfo({ context }, { userInfo: user, account });
  expect(result.data.user.id).toBe(user.id);
  expect(await linkOAuthAccount({ context }, {
    link: { userId: user.id, email: user.email }, userInfo: user,
    account: { providerId: "google", accountId: "explicit" },
  })).toEqual({ linked: true });
  expect(createAccount).toHaveBeenCalledTimes(1);
});
