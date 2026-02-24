import * as React from "react"
import type { ToastProps } from "@/components/ui/toast"
const TOAST_LIMIT = 1; const TOAST_REMOVE_DELAY = 5000
type ToasterToast = ToastProps & { id: string; title?: React.ReactNode; description?: React.ReactNode }
let count = 0; function genId() { return String(++count) }
const listeners: Array<(s: { toasts: ToasterToast[] }) => void> = []
let memoryState: { toasts: ToasterToast[] } = { toasts: [] }
function dispatch(action: any) {
  const { type, toast, toastId } = action
  if (type === "ADD_TOAST") memoryState = { toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT) }
  if (type === "DISMISS_TOAST") {
    memoryState = { toasts: memoryState.toasts.map(t => (!toastId || t.id === toastId) ? { ...t, open: false } : t) }
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId }), TOAST_REMOVE_DELAY)
  }
  if (type === "REMOVE_TOAST") memoryState = { toasts: toastId ? memoryState.toasts.filter(t => t.id !== toastId) : [] }
  listeners.forEach(l => l(memoryState))
}
export function toast(props: Omit<ToasterToast, "id">) {
  const id = genId()
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open: boolean) => { if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id }) } } })
  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) }
}
export function useToast() {
  const [state, setState] = React.useState(memoryState)
  React.useEffect(() => { listeners.push(setState); return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) } }, [])
  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) }
}
