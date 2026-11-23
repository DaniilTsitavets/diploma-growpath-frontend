import type { components } from '@/shared/api/schema/expert-consultation'

export type Role = components['schemas']['Role']
export type Me = components['schemas']['MeResponse']

/** A user in no group is an ordinary customer. */
export const roleOf = (me: Me): Role => me.role ?? 'user'

/** Where each role starts: experts and admins have no shop, so the home page would be a dead end for them. */
export function homePath(role: Role | null): string {
  if (role === 'expert') return '/expert/tickets'
  if (role === 'admin') return '/admin/users'
  return '/'
}

/** Only used when GET /v1/me cannot be had: the most privileged group in the token, as the backend itself ranks them. */
export function roleFromGroups(groups: string[]): Role {
  if (groups.includes('admins')) return 'admin'
  if (groups.includes('experts')) return 'expert'
  return 'user'
}
