export type EventLightColors = {
  main: string
  container: string
  onContainer: string
}

export type EventColorConfig = {
  colorName: string
  lightColors: EventLightColors
}

export type EventsColorsMap = Record<string, EventColorConfig>

export type UserPreferences = {
  eventsColors: EventsColorsMap
}
