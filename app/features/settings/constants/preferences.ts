import type { UserPreferences } from "../types";

export const defaultPreferences = {
  eventsColors: {
    internal: {
      colorName: 'personal',
      lightColors: {
        main: 'rgb(120, 120, 120)',
        container: 'rgba(120, 120, 120, 0.2)',
        onContainer: 'rgb(120, 120, 120)',
      },
    },
  },
} satisfies UserPreferences
