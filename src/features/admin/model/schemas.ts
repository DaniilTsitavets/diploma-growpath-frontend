import { z } from 'zod'

const roles = ['user', 'expert', 'admin'] as const

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email')
    .regex(/^[^@\s]+@[^@\s]+$/, 'Enter a valid email'),
  password: z.string().min(1, 'Enter a temporary password'),
  role: z.enum(roles, { message: 'Choose a role' }),
})
export type CreateUserValues = z.infer<typeof createUserSchema>

export const passwordSchema = z.object({ password: z.string().min(1, 'Enter a new password') })
export type PasswordValues = z.infer<typeof passwordSchema>

export const roleSchema = z.object({ role: z.enum(roles, { message: 'Choose a role' }) })
export type RoleValues = z.infer<typeof roleSchema>
