import { label as inputLabel } from '~/components/ui/input/input'
import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex items-center',
  variants: {
    disabled: {
      true: 'opacity-70',
      false: '',
    },
  },
})

export const radio = tv({
  base: 'flex appearance-none items-center justify-center rounded-full cursor-pointer',
  variants: {
    checked: {
      true: '',
      false: 'border border-controls',
      indeterminate: '',
    },
    disabled: {
      true: 'cursor-not-allowed',
      false: '',
    },
    color: {
      default: 'bg-foreground',
      primary: 'bg-primary',
      error: 'bg-error',
    },
    isError: {
      true: 'border-error',
      false: '',
    },
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    },
  },

  compoundVariants: [
    {
      checked: false,
      color: ['default', 'primary', 'error'],
      class: 'bg-transparent',
    },
  ],

  defaultVariants: {
    color: 'default',
    size: 'md',
  },
})

export const label = tv({
  extend: inputLabel,
  base: 'mb-0! ml-2',
  variants: {
    size: {
      md: 'text-[14px]',
    },
    disabled: {
      true: 'cursor-not-allowed',
      false: '',
    },
    isError: {
      true: 'text-error',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const icon = tv({
  base: 'absolute top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%] text-background pointer-events-none',
  variants: {
    color: {
      default: 'text-background',
      primary: 'text-black',
      error: 'text-black',
    },
    size: {
      sm: 'size-5',
      md: 'size-6',
      lg: 'size-7',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})
