import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createFakeClient } from '@shared/api/demo/fake-client'
import type { AppNotification } from '@shared/types/notification'

const row = (id: string, userId: string, readAt: string | null): AppNotification => ({
  id,
  user_id: userId,
  type: 'event_created',
  source: 'google',
  title: `Event ${id}`,
  description: null,
  author_name: 'Jordan Lee',
  author_email: 'jordan@studio.io',
  calendar_event_id: null,
  event_start_at: null,
  read_at: readAt,
  created_at: '2026-11-11T10:00:00.000Z',
})

let db: ReturnType<typeof createFakeClient>
let onInsert: ((payload: { new: AppNotification }) => void) | null
const channelSpy = vi.fn()
const removeChannelSpy = vi.fn()

vi.mock('@shared/api/supabase', () => ({
  useDb: () => ({
    from: (table: string) => db.from(table as never),
    channel: (name: string) => {
      const channel = {
        on: (_type: string, filter: unknown, callback: (payload: { new: AppNotification }) => void) => {
          channelSpy(name, filter)
          onInsert = callback
          return channel
        },
        subscribe: () => channel,
      }
      return channel
    },
    removeChannel: async (channel: unknown) => {
      removeChannelSpy(channel)
      return 'ok'
    },
  }),
}))

const { useUnreadNotifications } = await import('@entities/notification/composables/useUnreadNotifications')

describe('useUnreadNotifications', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await useUnreadNotifications().stop()
    channelSpy.mockReset()
    removeChannelSpy.mockReset()
    onInsert = null
    db = createFakeClient({
      calendar_events: [],
      google_accounts: [],
      notes: [],
      settings: [],
      notifications: [row('n1', 'u1', null), row('n2', 'u1', null), row('n3', 'u1', '2026-11-10T00:00:00.000Z'), row('n4', 'u2', null)],
    })
  })

  it('counts only the unread notifications of the user', async () => {
    const { start, unreadCount } = useUnreadNotifications()
    await start('u1')

    expect(unreadCount.value).toBe(2)
  })

  it('subscribes to inserts of the user only and counts each arrival', async () => {
    const { start, unreadCount, latest } = useUnreadNotifications()
    await start('u1')

    expect(channelSpy).toHaveBeenCalledWith('notifications:u1', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: 'user_id=eq.u1',
    })

    onInsert!({ new: row('n5', 'u1', null) })

    expect(unreadCount.value).toBe(3)
    expect(latest.value?.id).toBe('n5')
  })

  it('does not subscribe twice for the same user and resubscribes for another one', async () => {
    const { start } = useUnreadNotifications()
    await start('u1')
    await start('u1')
    expect(channelSpy).toHaveBeenCalledTimes(1)

    await start('u2')
    expect(removeChannelSpy).toHaveBeenCalledTimes(1)
    expect(channelSpy).toHaveBeenLastCalledWith('notifications:u2', expect.objectContaining({ filter: 'user_id=eq.u2' }))
  })

  it('marks every unread notification of the user as read', async () => {
    const { start, markAllAsRead, unreadCount } = useUnreadNotifications()
    await start('u1')
    await markAllAsRead('u1')

    expect(unreadCount.value).toBe(0)
    const { data } = await db.from('notifications').select('id, read_at').is('read_at', null)
    expect(data).toEqual([{ id: 'n4', read_at: null }])
  })
})
