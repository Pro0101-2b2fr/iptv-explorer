'use client'

import { useToasts } from '@/lib/favorites'
import { useEffect, useState, createContext, useContext, ReactNode } from 'react'

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export const ToastContext = createContext<ToastContextType>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast } = useToasts()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm shadow-lg animate-slide-up border backdrop-blur-sm ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                toast.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-zinc-800/90 text-zinc-200 border-zinc-700/50'
              }`}
              role="status"
            >
              {toast.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === 'error' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
              >
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}