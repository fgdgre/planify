import type { TourStep } from '@shared/api/demo/director-protocol'

export interface DemoStepCopy {
  step: TourStep
  number: string
  title: string
  text: string
  hint: string
}

/** One entry per tour step, in the order the embedded demo plays them. */
export const demoSteps: readonly DemoStepCopy[] = [
  { step: 1, number: '01 · Unified calendar', title: 'Every account on one grid', text: 'Connect up to three Google accounts. Each gets its own color, so you see whose meeting it is at a glance.', hint: 'Try it: switch an account off in the sidebar.' },
  { step: 2, number: '02 · Your own events', title: 'Plan your own time', text: 'Click any free slot to add an event, then edit, drag or delete it. Synced Google events stay read-only.', hint: 'Try it: click an empty slot in the grid.' },
  { step: 3, number: '03 · Notes', title: 'Notes that live inside the meeting', text: 'Attach notes to any event, or write one while creating it. Open the meeting next week and the context is right there.', hint: 'Try it: click any event and add a note.' },
  { step: 4, number: '04 · Search', title: 'Find anything, across every account', text: 'One search box over all your calendars. "When did I last talk to Acme?" takes two seconds.', hint: 'Try it: type "studio" and press Enter.' },
  { step: 5, number: '05 · Dashboard', title: 'Your week at a glance', text: 'Events per day, what\'s coming up today and your schedule, across every account.', hint: 'Try it: open Dashboard, then add an event and watch it update.' },
]
