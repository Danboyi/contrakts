import { toast } from 'sonner'

type ToastOptions = Parameters<typeof toast>[1]

/**
 * Success toast with a checkmark icon prefix.
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    ...options,
  })
}

/**
 * Error toast with an X icon prefix.
 */
export function toastError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    ...options,
  })
}

/**
 * Toast with an "Undo" action button. Auto-dismisses after 5 seconds.
 * Calls `onUndo` when the user clicks the Undo button.
 */
export function toastUndo(message: string, onUndo: () => void) {
  return toast(message, {
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: onUndo,
    },
  })
}

/**
 * Shows a loading toast while a promise is pending, then resolves to a
 * success or error toast based on the promise result.
 */
export function toastProgress<T>(
  message: string,
  promise: Promise<T>,
) {
  return toast.promise(promise, {
    loading: message,
    success: () => `${message} — done`,
    error: (err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong'
      return `${message} — ${errorMessage}`
    },
  })
}
