export type DemoAccountId = 'acme' | 'studio' | 'personal' | 'planify'

export interface DemoAccount {
  id: DemoAccountId
  name: string
  email?: string
  color: string
  own: boolean
}

export interface DemoNote {
  title: string
  body: string
}

export interface DemoEvent {
  id: number
  title: string
  account: DemoAccountId
  day: number
  start: number
  length: number
  where?: string
  description?: string
  notes: DemoNote[]
}

export const DEMO_START_HOUR = 9
export const DEMO_END_HOUR = 16
export const DEMO_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function createDemoAccounts(): DemoAccount[] {
  return [
    { id: 'acme', name: 'acme.com', email: 'dana@acme.com', color: '#e5484d', own: false },
    { id: 'studio', name: 'studio.io', email: 'team@studio.io', color: '#30a46c', own: false },
    { id: 'personal', name: 'personal', email: 'me@gmail.com', color: '#3e7bfa', own: false },
    { id: 'planify', name: 'Planify', color: '#9688CF', own: true },
  ]
}

export function createDemoEvents(): DemoEvent[] {
  return [
    {
      id: 1,
      title: 'Acme standup',
      account: 'acme',
      day: 0,
      start: 9,
      length: 1.5,
      where: 'Google Meet',
      description: 'Weekly sync on the v2 roadmap.',
      notes: [
        { title: 'Scope for v2', body: 'Agreed: ship onboarding first, pricing page in May.' },
        { title: 'Open questions', body: 'Who owns analytics? Ask Dana.' },
      ],
    },
    { id: 2, title: 'Studio review', account: 'studio', day: 2, start: 9, length: 1, notes: [] },
    { id: 3, title: 'Acme sync', account: 'acme', day: 4, start: 9, length: 0.5, notes: [] },
    { id: 4, title: 'Dentist', account: 'personal', day: 1, start: 10, length: 1.5, notes: [] },
    {
      id: 5,
      title: 'Deep work',
      account: 'planify',
      day: 3,
      start: 10,
      length: 1.5,
      notes: [{ title: 'Plan', body: 'Draft the Acme proposal.' }],
    },
    { id: 6, title: 'Acme 1:1', account: 'acme', day: 2, start: 11, length: 0.5, notes: [] },
    {
      id: 7,
      title: 'Studio call',
      account: 'studio',
      day: 4,
      start: 11,
      length: 1,
      where: 'Zoom',
      description: 'QA review with the design team.',
      notes: [{ title: 'Feedback', body: 'They want the QA report by Friday.' }],
    },
    { id: 8, title: 'Lunch', account: 'personal', day: 0, start: 12.5, length: 1, notes: [] },
    { id: 9, title: 'Studio QA', account: 'studio', day: 1, start: 12, length: 1, notes: [] },
    { id: 10, title: 'Acme demo', account: 'acme', day: 3, start: 13, length: 1, notes: [] },
    { id: 11, title: 'Invoices', account: 'planify', day: 1, start: 14, length: 1, notes: [] },
    { id: 12, title: 'Write proposal', account: 'planify', day: 4, start: 13.5, length: 1.5, notes: [] },
    { id: 13, title: 'Gym', account: 'personal', day: 2, start: 14.5, length: 1, notes: [] },
  ]
}

export function formatHour(hour: number): string {
  const whole = Math.floor(hour)
  const minutes = Math.round((hour - whole) * 60)
  const hours = whole > 12 ? whole - 12 : whole
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

export function matchesQuery(event: DemoEvent, account: DemoAccount, query: string): boolean {
  const text = query.trim().toLowerCase()
  if (!text) return false
  return event.title.toLowerCase().includes(text) || account.name.toLowerCase().includes(text)
}

export function layoutDay(events: DemoEvent[]): { id: number; column: number; columns: number }[] {
  const sorted = [...events].sort((a, b) => a.start - b.start)
  const columnEnds: number[] = []
  const columns = sorted.map((event) => {
    let column = columnEnds.findIndex(end => end <= event.start)
    if (column < 0) {
      column = columnEnds.length
      columnEnds.push(0)
    }
    columnEnds[column] = event.start + event.length
    return column
  })

  return sorted.map((event, index) => {
    let maxColumn = columns[index]!
    sorted.forEach((other, otherIndex) => {
      const overlaps = other.start < event.start + event.length && event.start < other.start + other.length
      if (overlaps) maxColumn = Math.max(maxColumn, columns[otherIndex]!)
    })
    return { id: event.id, column: columns[index]!, columns: maxColumn + 1 }
  })
}

export function snapStart(rawHour: number, length: number): number {
  const snapped = Math.round(rawHour * 2) / 2
  return Math.min(Math.max(snapped, DEMO_START_HOUR), DEMO_END_HOUR - length)
}

export function hoursByDay(events: DemoEvent[], visible: DemoAccountId[]) {
  return DEMO_DAYS.map((_, day) => {
    const byAccount: Partial<Record<DemoAccountId, number>> = {}
    let total = 0
    events.forEach((event) => {
      if (event.day !== day || !visible.includes(event.account)) return
      byAccount[event.account] = (byAccount[event.account] ?? 0) + event.length
      total += event.length
    })
    return { day, total, byAccount }
  })
}
