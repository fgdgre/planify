import type { Database } from "@shared/api/supabase/types/database";

export type GoogleCalendarEvent = Database['public']['Tables']['google_calendars']['Row']

export type UserCalendarEvents = Record<string, GoogleCalendarEvent[]>
