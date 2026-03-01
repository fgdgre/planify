import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex gap-2 items-center',
  variants: {
    disabled: {
      true: 'opacity-50',
    },
  },
})

export const label = tv({
  base: 'text-foreground text-[15px] leading-none select-none',
  variants: {
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export const switchElement = tv({
  base: 'inline-flex items-center shrink-0 rounded-full border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)] bg-switch transition-colors duration-200 data-[state=checked]:bg-[var(--ui-primary)] focus-visible:ring-[var(--ui-primary)] w-9',
  variants: {
    color: {
      default: 'data-[state=checked]:bg-switch-checked',
      primary: 'data-[state=checked]:bg-primary',
      error: 'data-[state=checked]:bg-error',
    },
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export const thumb = tv({
  base: 'pointer-events-none rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0 flex items-center justify-center size-4 data-[state=checked]:translate-x-4',
})
