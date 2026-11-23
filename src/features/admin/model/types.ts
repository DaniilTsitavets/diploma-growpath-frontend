import type { components } from '@/shared/api/schema/expert-consultation'

type Schemas = components['schemas']

export type AdminUser = Schemas['UserResponse']
export type UserPage = Schemas['UsersResponse']
export type CreateUserRequest = Schemas['CreateUserRequest']
export type { Role } from '@/features/auth/model/role'

export const ROLE_LABELS = { user: 'User', expert: 'Expert', admin: 'Administrator' } as const
