import { tv } from 'tailwind-variants'
import { sizeVariants } from '~/shared/variants/size'

export const button = tv({
  extend: sizeVariants,
  base: 'flex gap-x-[5px] items-center justify-center cursor-pointer w-fit select-none transition-colors px-4 py-2 pointer-events-auto font-medium text-sm touch-manipulation',
  variants: {
    color: {
      primary: 'bg-primary text-[#fff] hover:bg-primary/80',
      error: 'bg-error text-[#18181b] hover:bg-error/80',
      theme: 'bg-foreground text-background hover:bg-foreground/80',
      false: '',
    },
    rounded: {
      default: 'rounded-md',
      full: 'rounded-full',
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
  ],
})
