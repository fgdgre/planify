import { useNotificationsStore } from '../stores/notificationStore'

export const useNotification = () => {
  const store = useNotificationsStore()

  return {
    toasts: computed(() => store.toasts),
    showToast: store.showToast,
    showSuccessToast: store.showSuccessToast,
    showErrorToast: store.showErrorToast,
    removeToast: store.removeToast,
    clearToasts: store.clearToasts,
  }
}
