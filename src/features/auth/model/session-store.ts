import { create } from 'zustand'
import { readIdToken } from './jwt'

export interface Session {
  idToken: string
  refreshToken: string
  email: string | null
  groups: string[]
  expiresAt: number
}

const STORAGE_KEY = 'growpath.session'

function load(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function save(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked; the session then lives in memory only.
  }
}

interface SessionState {
  session: Session | null
  setTokens: (tokens: { idToken: string; refreshToken: string }) => void
  clear: () => void
}

export const useSession = create<SessionState>((set) => ({
  session: load(),
  setTokens: ({ idToken, refreshToken }) => {
    const claims = readIdToken(idToken)
    const session: Session = {
      idToken,
      refreshToken,
      email: claims.email,
      groups: claims.groups,
      expiresAt: claims.expiresAt,
    }
    save(session)
    set({ session })
  },
  clear: () => {
    save(null)
    set({ session: null })
  },
}))
