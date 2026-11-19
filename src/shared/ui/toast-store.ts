import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info') =>
    set((state) => ({ toasts: [...state.toasts, { id: nextId++, message, tone }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
