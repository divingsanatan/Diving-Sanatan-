import { getSession, PANEL_ROLES } from "./authSession";

/** True when the request carries a valid signed-in session of someone who works in the admin panel. */
export function isPanelRequest(req: Request): boolean {
  const s = getSession(req);
  return !!s && PANEL_ROLES.includes(s.role);
}

/** The admin version of a list (drafts, pending items, private fields): only for panel users who ask for it. */
export function wantsAdminView(req: Request, param = "admin_view"): boolean {
  return new URL(req.url).searchParams.get(param) === "true" && isPanelRequest(req);
}

/**
 * Cache rules for lists that admin screens also read.
 * Admin responses are never stored anywhere. Public responses are never kept by the web host's shared cache,
 * so a save in the admin shows up on the very next load instead of minutes later.
 */
export const ADMIN_NO_STORE = { "Cache-Control": "no-store" } as const;
export const PUBLIC_REVALIDATE = { "Cache-Control": "public, max-age=0, must-revalidate" } as const;
