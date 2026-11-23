import { useState, type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import type { Item } from '../model/types'
import { OrderDialog } from './OrderDialog'

/** Ordering needs an account: a visitor goes to sign in and comes back to this page afterwards. */
export function useOrderFlow(): { start: (item: Item) => void; dialog: ReactElement | null } {
  const session = useSession((state) => state.session)
  const location = useLocation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Item | null>(null)

  function start(item: Item) {
    if (session) setSelected(item)
    else void navigate('/login', { state: { from: location.pathname + location.search } })
  }

  const dialog = selected ? (
    <OrderDialog key={selected.id} item={selected} onClose={() => setSelected(null)} />
  ) : null

  return { start, dialog }
}
