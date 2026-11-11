import type { Toast } from '@shared/lib/toast'
import type { AppNotification } from '@shared/types/notification'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const eventStartFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const describe = (notification: AppNotification) => {
  const parts = [
    notification.event_start_at ? `Starts ${eventStartFormat.format(new Date(notification.event_start_at))}` : null,
    notification.description,
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : undefined
}

export const toNotificationToast = (notification: AppNotification): Toast => ({
  id: notification.id,
  title: notification.title,
  description: describe(notification),
  color: 'info',
  icon: 'lucide:calendar-plus',
  closable: false,
  date: dateFormat.format(new Date(notification.created_at)),
  author: notification.author_name ?? undefined,
  email: notification.author_email ?? undefined,
})
