import { api } from '@/shared/api/client'
import type { AdminUser, CreateUserRequest, Role, UserPage } from '../model/types'

const user = (userId: string) => `/v1/admin/users/${encodeURIComponent(userId)}`

export const listUsers = (cursor?: string, signal?: AbortSignal) =>
  api.request<UserPage>('GET', '/v1/admin/users', { query: { cursor }, signal })

export const createUser = (body: CreateUserRequest) =>
  api.request<AdminUser>('POST', '/v1/admin/users', { body })

export const changeRole = (userId: string, role: Role) =>
  api.request<AdminUser>('PUT', `${user(userId)}/role`, { body: { role } })

export const setEnabled = (userId: string, enabled: boolean) =>
  api.request<void>('POST', `${user(userId)}/${enabled ? 'enable' : 'disable'}`)

export const resetPassword = (userId: string, password: string) =>
  api.request<void>('POST', `${user(userId)}/password`, { body: { password } })
