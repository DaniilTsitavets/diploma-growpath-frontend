import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { upgradeHint } from '@/features/entitlement/model/tiers'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useDiagnosis, useRunDiagnosis } from '../api/queries'
import { dominanceNote } from '../model/dominance'
import { isAiQuotaExhausted } from '../model/errors'
import { ClarificationForm } from './ClarificationForm'
import styles from './DiagnosisPanel.module.css'

interface DiagnosisPanelProps {
  updateId: string
  journalId: string
  /** Why the check cannot run yet, such as missing photos; the run button waits. */
  blockedReason?: string
}

export function DiagnosisPanel({ updateId, journalId, blockedReason }: DiagnosisPanelProps) {
  const diagnosis = useDiagnosis(updateId)
  const run = useRunDiagnosis(updateId, journalId)
  const entitlement = useEntitlement()

  if (diagnosis.isPending) return <Skeleton height="panel" />
  if (diagnosis.error) {
    return (
      <div role="alert">
        <p className={styles.error}>{describeError(diagnosis.error)}</p>
        <Button onClick={() => void diagnosis.refetch()}>Try again</Button>
      </div>
    )
  }

  const data = diagnosis.data
  const quotaExhausted = isAiQuotaExhausted(run.error)
  const hint = quotaExhausted && entitlement.data ? upgradeHint(entitlement.data.tier) : null

  const runError = run.error && (
    <div role="alert" className={styles.error}>
      <p>{quotaExhausted ? 'Your AI checks for today are used up.' : describeError(run.error)}</p>
      {hint && <p>{hint}</p>}
    </div>
  )

  if (data.status === 'diagnosis_pending') {
    return (
      <div className={styles.panel}>
        <p>The check has not run yet. Your answers and photos are saved.</p>
        {blockedReason && <p role="status">{blockedReason}</p>}
        {runError}
        <Button onClick={() => run.mutate()} disabled={run.isPending || Boolean(blockedReason)}>
          {run.isPending ? 'Checking your plant…' : 'Run diagnosis'}
        </Button>
      </div>
    )
  }

  if (data.status === 'awaiting_clarification' && data.clarifying_question) {
    return (
      <div className={styles.panel}>
        <p>
          {data.has_dominant_candidate === false
            ? 'The cause is ambiguous, so the AI needs one more detail. Please answer its question.'
            : 'The AI needs one more detail.'}
        </p>
        {data.roots_photo_requested && (
          <p className={styles.note}>
            It also asks for a photo of the roots and drainage. Add it under Photos above.
          </p>
        )}
        <ClarificationForm
          updateId={updateId}
          journalId={journalId}
          question={data.clarifying_question}
        />
      </div>
    )
  }

  if (data.status === 'degraded') {
    return (
      <div className={styles.panel}>
        <p role="status">
          The AI could not give an answer this time. Nothing was charged for the failed attempt.
        </p>
        {data.recommendation && <p className={styles.recommendation}>{data.recommendation}</p>}
        {runError}
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? 'Checking your plant…' : 'Retry diagnosis'}
        </Button>
        <p className={styles.note}>A new attempt uses one AI check; if it fails it is returned.</p>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {dominanceNote(data.has_dominant_candidate) && (
        <p className={styles.note}>{dominanceNote(data.has_dominant_candidate)}</p>
      )}
      <ol className={styles.candidates} aria-label="Possible causes, most likely first">
        {data.candidates.map((candidate) => (
          <li key={candidate.rank}>
            <div>
              <span className={styles.cause}>{candidate.cause}</span>
              <p className={styles.rationale}>{candidate.rationale}</p>
            </div>
          </li>
        ))}
      </ol>
      {data.recommendation && <p className={styles.recommendation}>{data.recommendation}</p>}
    </div>
  )
}
