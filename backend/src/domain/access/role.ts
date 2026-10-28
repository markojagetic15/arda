/** Notion-style access levels, weakest to strongest. */
export const ROLES = ['view', 'comment', 'edit', 'full'] as const;
export type Role = (typeof ROLES)[number];

export const SCOPE_TYPES = ['space', 'project', 'page'] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

export interface Scope {
  type: ScopeType;
  id: string;
}

export function roleRank(role: Role | null | undefined): number {
  return role ? ROLES.indexOf(role) + 1 : 0;
}

export function maxRole(...roles: (Role | null | undefined)[]): Role | null {
  let best: Role | null = null;
  for (const role of roles) {
    if (roleRank(role) > roleRank(best)) best = role ?? null;
  }
  return best;
}

export function hasRole(role: Role | null | undefined, min: Role): boolean {
  return roleRank(role) >= roleRank(min);
}
