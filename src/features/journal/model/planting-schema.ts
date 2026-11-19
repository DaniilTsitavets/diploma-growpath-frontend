import { z } from 'zod'
import { todayIso } from './dates'

export const plantingSchema = z.object({
  planted_on: z
    .string()
    .min(1, 'Choose the planting date')
    .refine((value) => value <= todayIso(), { message: 'The date cannot be in the future' }),
})

export type PlantingValues = z.infer<typeof plantingSchema>
