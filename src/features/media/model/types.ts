import { z } from 'zod'

export const mediaCreditSchema = z.object({
  slug: z.string(),
  key: z.string(),
  author: z.string(),
  license: z.string(),
  source: z.string(),
})

export const mediaCreditsSchema = z.array(mediaCreditSchema)

export type MediaCredit = z.infer<typeof mediaCreditSchema>
