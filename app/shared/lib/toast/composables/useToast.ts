import { useToastStore } from '../stores/toast'

export const useToast = () => {
  const store = useToastStore()

  return {
    toasts: computed(() => store.toasts),
    showToast: store.showToast,
    showSuccessToast: store.showSuccessToast,
    showErrorToast: store.showErrorToast,
    removeToast: store.removeToast,
    clearToasts: store.clearToasts,
  }
}
