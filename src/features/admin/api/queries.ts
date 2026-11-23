import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateUserRequest, Role } from '../model/types'
import { changeRole, createUser, listUsers, resetPassword, setEnabled } from './admin-api'

const usersKey = ['admin', 'users'] as const

export function useUsers() {
  return useInfiniteQuery({
    queryKey: usersKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listUsers(pageParam, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/** The dialogs show these errors next to the form, so they are not announced as toasts. */
function useUserMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    meta: { handledInline: true },
    onSuccess: () => client.invalidateQueries({ queryKey: usersKey }),
  })
}

export const useCreateUser = () => useUserMutation((body: CreateUserRequest) => createUser(body))

export const useChangeRole = () =>
  useUserMutation(({ userId, role }: { userId: string; role: Role }) => changeRole(userId, role))

export const useSetEnabled = () =>
  useUserMutation(({ userId, enabled }: { userId: string; enabled: boolean }) =>
    setEnabled(userId, enabled),
  )

export const useResetPassword = () =>
  useUserMutation(({ userId, password }: { userId: string; password: string }) =>
    resetPassword(userId, password),
  )
