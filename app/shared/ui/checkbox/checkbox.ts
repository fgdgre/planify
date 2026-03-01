import { tv } from 'tailwind-variants'
export { label } from '~/shared/ui/radio/radio'

export const wrapper = tv({
  base: 'flex items-center',
  variants: {
    disabled: {
      true: 'opacity-70',
      false: '',
    },
  },
})

export const checkbox = tv({
  base: 'flex appearance-none items-center justify-center rounded-[4px] cursor-pointer',
  variants: {
    checked: {
      true: '',
      false: 'border border-controls',
      indeterminate: '',
    },
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    },
    disabled: {
      true: 'cursor-not-allowed',
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

export const icon = tv({
  base: 'size-5 absolute top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%] text-background pointer-events-none',
  variants: {
    color: {
      default: 'text-background',
      primary: 'text-black',
      error: 'text-black',
    },
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})
