import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex items-start w-full gap-4',
})

export const triggersWrapper = tv({
  base: 'w-full flex flex-col items-center justify-center gap-x-2 group relative',
  variants: {
    triggerSize: {
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
    },
    disabled: {
      true: 'opacity-50',
      false: '',
    },
  },
})

export const trigger = tv({
  base: 'inline-flex items-center justify-center rounded-full text-placeholder shrink-0 bg-transparent border-2 border-border cursor-pointer z-10',
  variants: {
    size: {
      sm: 'w-[42px] h-[42px]',
      md: 'w-[50px] h-[50px]',
      lg: 'w-[60px] h-[60px]',
    },
    active: {
      true: 'bg-primary text-[#18181b] ring-1 ring-foreground ring-offset-2 ring-offset-background border-none',
      false: '',
    },
    completed: {
      true: 'bg-foreground text-background',
      false: '',
    },
    disabled: {
      true: 'cursor-default',
      false: '',
    },
  },
  compoundVariants: [
    { active: false, disabled: false, class: 'text-foreground border-foreground' },
    { active: true, disabled: false, class: 'text-background border-0' },
    { completed: true, disabled: false, class: 'text-background border-0' },
  ],
})

export const separator = tv({
  base: 'absolute block top-[50%] translate-y-[-50%] h-0.5 rounded-full bg-border',
  variants: {
    triggerSize: {
      sm: 'left-[calc(50%+22px)] right-[calc(-50%+6px)]',
      md: 'left-[calc(50%+27px)] right-[calc(-50%+11px)]',
      lg: 'left-[calc(50%+32px)] right-[calc(-50%+16px)]',
    },
    active: {
      true: '',
      false: '',
    },
    completed: {
      true: 'bg-foreground',
      false: '',
    },
    disabled: {
      true: '',
      false: '',
    },
  },
})

export const paragraphsWrapper = tv({
  base: 'absolute top-full left-0 text-center w-full mt-2 select-none',
  variants: {
    triggerSize: {
      sm: '',
      md: '',
      lg: '',
    },
  },
})

export const title = tv({
  base: 'font-medium',
  variants: {
    triggerSize: {
      sm: '',
      md: '',
      lg: '',
    },
  },
})

export const description = tv({
  base: 'text-xs',
  variants: {
    triggerSize: {
      sm: '',
      md: '',
      lg: '',
    },
  },
})
