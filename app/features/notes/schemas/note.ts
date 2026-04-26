import { z } from 'zod'

export const noteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  calendar_event_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const noteInsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  content: z.string().optional(),
  calendar_event_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const noteUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  calendar_event_id: z.string().uuid().nullable().optional(),
  updated_at: z.string().optional(),
})

export const notesResponseSchema = z.array(noteSchema)

export type NoteSchema = z.infer<typeof noteSchema>
export type NoteInsertSchema = z.infer<typeof noteInsertSchema>
export type NoteUpdateSchema = z.infer<typeof noteUpdateSchema>
