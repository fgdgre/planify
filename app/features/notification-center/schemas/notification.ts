import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  author_name: z.string().nullable(),
  author_email: z.string().nullable(),
  calendar_event_id: z.string().uuid().nullable(),
  event_start_at: z.string().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
})

export const notificationsResponseSchema = z.array(notificationSchema)

export type NotificationSchema = z.infer<typeof notificationSchema>
