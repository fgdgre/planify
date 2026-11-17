export const API = {
  TABLES: {
    CALENDAR_EVENTS: 'calendar_events',
    GOOGLE_ACCOUNTS: 'google_accounts',
    NOTES: 'notes',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'settings',
  },
  FUNCTIONS: {
    GOOGLE_OAUTH_START: 'google-oauth-start',
    GOOGLE_OAUTH_COMPLETE: 'google-oauth-complete',
    GOOGLE_LIST_CALENDARS: 'google-list-calendars',
    GOOGLE_SYNC_EVENTS: 'google-sync-events',
  },
  CHANNELS: {
    NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  },
} as const

export type ApiTable = (typeof API.TABLES)[keyof typeof API.TABLES]
export type ApiFunction = (typeof API.FUNCTIONS)[keyof typeof API.FUNCTIONS]
