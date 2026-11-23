import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { entitlementKey } from '@/features/entitlement/api/use-entitlement'
import { runDiagnosis } from '@/features/diagnosis/api/diagnosis-api'
import type { PhotoKind, PlantUpdate, SubmitUpdateRequest } from '../model/types'
import { journalKeys } from './queries'
import { submitUpdate } from './journal-api'
import { uploadPhoto } from './photo-upload'

export type SubmitStep = 'idle' | 'saving' | 'photos' | 'diagnosing'

export interface SubmitFlowInput {
  journalId: string
  request: SubmitUpdateRequest
  photos: Partial<Record<PhotoKind, File>>
}

/**
 * Saves the update, uploads the photos that were chosen and, when both main photos are there, starts the diagnosis. Saving is idempotent by the request id,
 * so running the whole flow again after a failure continues with the same update.
 */
export async function submitUpdateFlow(
  { journalId, request, photos }: SubmitFlowInput,
  onStep: (step: SubmitStep) => void,
): Promise<PlantUpdate> {
  onStep('saving')
  const update = await submitUpdate(journalId, request)

  onStep('photos')
  for (const [kind, file] of Object.entries(photos) as [PhotoKind, File][]) {
    await uploadPhoto(update.id, kind, file)
  }

  // The diagnosis needs both main photos. Without them the update is kept and the check waits for the photos.
  if (photos.overview && photos.soil) {
    onStep('diagnosing')
    await runDiagnosis(update.id)
  }
  return update
}

export function useSubmitUpdateFlow(journalId: string) {
  const client = useQueryClient()
  const [step, setStep] = useState<SubmitStep>('idle')
  const mutation = useMutation({
    mutationFn: (input: Omit<SubmitFlowInput, 'journalId'>) =>
      submitUpdateFlow({ journalId, ...input }, setStep),
    meta: { handledInline: true },
    onSettled: () => {
      setStep('idle')
      return Promise.all([
        client.invalidateQueries({ queryKey: journalKeys.updates(journalId) }),
        client.invalidateQueries({ queryKey: entitlementKey }),
      ])
    },
  })
  return { ...mutation, step }
}
