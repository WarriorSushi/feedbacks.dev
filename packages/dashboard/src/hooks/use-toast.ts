'use client'

import { useState, useEffect, useCallback } from 'react'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

let listeners: Array<(toast: ToastProps) => void> = []
let dismissListeners: Array<(id: string) => void> = []
let toastId = 0

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = String(++toastId)
  const t = { ...props, id }
  listeners.forEach((fn) => fn(t))
  return id
}

export function dismissToast(id: string) {
  dismissListeners.forEach((fn) => fn(id))
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((t: ToastProps) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    listeners.push(addToast)
    dismissListeners.push(dismiss)
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast)
      dismissListeners = dismissListeners.filter((fn) => fn !== dismiss)
    }
  }, [addToast, dismiss])

  return { toasts, toast, dismiss }
}
