import { z } from 'zod'

export const eventLightColorsSchema = z.object({
  main: z.string(),
  container: z.string(),
  onContainer: z.string(),
})

export const eventColorConfigSchema = z.object({
  colorName: z.string(),
  lightColors: eventLightColorsSchema,
})

export const userPreferencesSchema = z.object({
  eventsColors: z.record(z.string(), eventColorConfigSchema),
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>
