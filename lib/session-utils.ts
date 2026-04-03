export type SessionLike = {
  user?: {
    id?: string;
    role?: string | null;
    banned?: boolean | null;
    isBanned?: boolean | null;
  } | null;
} | null;

export function getSessionRole(session: SessionLike): string {
  const role = session?.user?.role;
  return typeof role === "string" ? role.toLowerCase() : "";
}

export function isAdminRole(session: SessionLike): boolean {
  return getSessionRole(session) === "admin";
}

export function isUserBanned(session: SessionLike): boolean {
  const user = session?.user;
  return Boolean(user && (user.banned ?? user.isBanned));
}
