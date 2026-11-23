import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { roleFromGroups, roleOf, type Me, type Role } from '../model/role'
import { useSession } from '../model/session-store'

/** The gateway says who the caller is; the interface follows this answer and not the groups inside the token. */
export function useMe() {
  const email = useSession((state) => state.session?.email ?? null)
  const signedIn = useSession((state) => state.session !== null)
  return useQuery({
    queryKey: ['me', email],
    queryFn: ({ signal }) => api.request<Me>('GET', '/v1/me', { signal }),
    enabled: signedIn,
    staleTime: Infinity,
    retry: 1,
    meta: { handledInline: true },
  })
}

interface RoleState {
  /** Null for a visitor, and while the answer is still on its way (see `pending`). */
  role: Role | null
  pending: boolean
  userId: string | null
}

export function useRole(): RoleState {
  const groups = useSession((state) => state.session?.groups ?? null)
  const me = useMe()
  if (groups === null) return { role: null, pending: false, userId: null }
  if (me.isPending) return { role: null, pending: true, userId: null }
  // Without an answer the token's groups decide what is shown; the backend still refuses what the role may not do.
  if (!me.data) return { role: roleFromGroups(groups), pending: false, userId: null }
  return { role: roleOf(me.data), pending: false, userId: me.data.user_id }
}
