import { z } from 'zod'
import { latestDateIso } from './dates'

export const plantingSchema = z.object({
  planted_on: z
    .string()
    .min(1, 'Choose the planting date')
    .refine((value) => value <= latestDateIso(), { message: 'The date cannot be in the future' }),
})

export type PlantingValues = z.infer<typeof plantingSchema>
