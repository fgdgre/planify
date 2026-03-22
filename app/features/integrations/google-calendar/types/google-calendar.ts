import type { Database } from "@shared/api/supabase/types/database";

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

export type UserCalendarEvents = Record<string, CalendarEvent[]>
