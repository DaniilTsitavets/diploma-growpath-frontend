import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'growpath.theme'

function initialTheme(): Theme {
  const applied = document.documentElement.dataset.theme
  return applied === 'dark' ? 'dark' : 'light'
}

function persist(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked; the choice then lasts until the page is closed.
  }
}

interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    persist(next)
    set({ theme: next })
  },
}))
