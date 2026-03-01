import { tv } from 'tailwind-variants'
import { sizeVariants } from '~/shared/variants/size'

export const button = tv({
  extend: sizeVariants,
  base: 'flex gap-x-[5px] items-center justify-center rounded-md cursor-pointer w-fit select-none transition-colors px-4 py-2 pointer-events-auto font-medium text-sm touch-manipulation',
  variants: {
    color: {
      primary: 'bg-primary text-[#18181b] hover:bg-primary/80',
      error: 'bg-error text-[#18181b] hover:bg-error/80',
      theme: 'bg-foreground text-background hover:bg-foreground/80',
      'edit-plan-table': 'bg-edit-plan-table-border text-[rgb(71,61,11)] hover:bg-edit-plan-table-border',
      false: '',
    },
    square: {
      true: 'p-2 w-9',
      false: '',
    },
    disabled: {
      true: 'opacity-70',
    },
    stretch: {
      width: 'w-full',
      height: 'h-full',
      both: 'w-full h-auto! min-h-full',
    },
    variant: {
      transparent: 'bg-transparent text-foreground hover:bg-transparent',
    },
    outline: {
      true: 'border border-border bg-transparent text-foreground',
    },
  },
  compoundVariants: [
    {
      outline: true,
      color: 'primary',
      class: 'border border-primary text-primary hover:bg-transparent',
    },
    {
      outline: true,
      color: 'error',
      class: 'border border-error text-error hover:bg-transparent',
    },
    {
      outline: true,
      color: 'theme',
      class: 'border border-foreground text-foreground hover:bg-transparent',
    },
    {
      outline: true,
      color: 'edit-plan-table',
      class: 'border-2 border-primary-text text-primary-text hover:bg-transparent',
    },
  ],
})
