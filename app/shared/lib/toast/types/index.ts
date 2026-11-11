export interface Toast {
  id: string
  title: string
  description?: string
  color?: 'primary-light' | 'primary' | 'error' | 'success' | 'info'
  icon?: string
  duration?: number
  showProgress?: boolean
  closable?: boolean
  date?: string
  author?: string
  email?: string
}
