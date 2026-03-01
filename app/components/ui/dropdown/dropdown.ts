import { tv } from 'tailwind-variants'
import { sizeVariants } from '~/shared/variants/size'
export { label, errorMessage } from '~/components/ui/input/input'

export const wrapper = tv({
  base: 'h-min',
})

export const menuTrigger = tv({
  extend: sizeVariants,
  base: 'w-full px-3 py-1 flex items-center justify-between rounded-md select-none text-sm gap-2 min-w-[75px] text-[14px] cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring focus-visible:ring-border-focus',
  variants: {
    color: {
      default: 'bg-background border border-border',
      error: 'bg-error',
      primary: 'bg-primary',
    },
    error: {
      true: 'border border-error',
      false: '',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
    selectItem: {
      true: 'min-w-[150px]',
      false: '',
    },
    moreThanMax: {
      true: 'min-w-[230px]',
      false: '',
    },
    noShadow: {
      true: '',
      false: 'input-shadow',
    },
    stickyPlaceholder: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    color: 'default',
  },
  compoundVariants: [
    {
      color: ['default', 'primary', 'error'],
      error: true,
      class: '',
    },
    {
      stickyPlaceholder: true,
      selectItem: true,
      class: 'min-w-[200px]',
    },
    {
      stickyPlaceholder: true,
      moreThanMax: true,
      class: 'min-w-[280px]',
    },
  ],
})

export const menuTriggerPlaceholder = tv({
  base: 'text-placeholder flex gap-2',
  variants: {
    color: {
      error: 'text-[#18181b]',
      primary: 'text-[#18181b]',
    },
    error: {
      true: 'text-error',
      false: '',
    },
  },
})

export const menuTriggerSelectedItem = tv({
  base: 'flex items-center gap-2 text-foreground overflow-hidden',
  variants: {
    color: {
      error: 'text-[#18181b]',
      primary: 'text-[#18181b]',
    },
    error: {
      true: 'text-error',
      false: '',
    },
  },
})

export const menuTriggerIcon = tv({
  base: 'size-[14px] transition-transform shrink-0 ml-auto',
  variants: {
    color: {
      default: 'text-placeholder',
      error: 'text-[#18181b]',
      primary: 'text-[#18181b]',
    },
    error: {
      true: 'text-error',
      false: '',
    },
    open: {
      true: 'rotate-[-180deg]',
      false: 'rotate-0',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})

export const menuContent = tv({
  base: 'flex flex-col bg-modal shadow-sm text-foreground border border-border rounded-md select-none p-1',
  variants: {
    color: {
      default: 'text-placeholder',
      error: 'text-foreground',
      primary: 'text-foreground',
    },
    error: {
      true: 'border border-error',
      false: '',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
    menuStretch: {
      true: 'w-[var(--radix-dropdown-menu-trigger-width)] min-w-max',
      false: '',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})

export const menuContentItem = tv({
  base: 'flex items-center text-sm rounded-md cursor-pointer w-full text-foreground px-2 py-1.5 gap-2 select-none ',
  variants: {
    color: {
      default: 'hover:bg-foreground/5',
      error: 'hover:bg-error/10',
      primary: 'hover:bg-primary/10',
    },
    disabled: {
      true: 'pointer-events-none',
      false: '',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})

export const itemsList = tv({
  base: 'flex-1 max-h-[150px] scrollbar-thin scrollbar-muted overflow-auto p-1',
})

export const menuTriggerSelectedItemBudge = tv({
  base: 'flex items-center bg-foreground text-background gap-1 cursor-default rounded-xl pl-2 pr-1',
  variants: {
    single: {
      true: 'overflow-hidden',
      false: '',
    },
  },
})

export const menuTriggerSelectedItemBudgeText = tv({
  base: 'text-nowrap text-xs',
  variants: {
    single: {
      true: 'truncate',
      false: '',
    },
  },
})
