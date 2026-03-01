export interface Toast {
  id: string
  title: string
  description?: string
  color?: 'primary-light' | 'primary' | 'error' | 'success'
  icon?: string
  duration?: number
  showProgress?: boolean
}
