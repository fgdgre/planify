import { ERROR_NOTIFICATION_DURATION, SUCCESS_NOTIFICATION_DURATION } from '../constants/duration'
import type { Toast } from '../types'

export const useNotificationsStore = defineStore('notification', () => {
  const toasts = ref<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const _toast: Toast = {
      id: self.crypto.randomUUID(),
      title: toast.title,
      description: toast.description,
      color: toast.color,
      icon: toast.icon,
      duration: toast.duration,
      showProgress: toast.showProgress,
    }
    toasts.value.push(_toast)
  }

  const showSuccessToast = ({
    title,
    description,
    showProgress = true,
    icon,
  }: {
    title: string
    description: string
    showProgress?: boolean
    icon?: string
  }) => {
    showToast({ title, description, color: 'success', duration: SUCCESS_NOTIFICATION_DURATION, showProgress, icon })
  }

  const showErrorToast = ({
    title,
    description,
    showProgress = true,
    icon,
  }: {
    title: string
    description: string
    showProgress?: boolean
    icon?: string
  }) => {
    showToast({ title, description, color: 'error', duration: ERROR_NOTIFICATION_DURATION, showProgress, icon })
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const clearToasts = () => {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    showSuccessToast,
    showErrorToast,
    removeToast,
    clearToasts,
  }
})
