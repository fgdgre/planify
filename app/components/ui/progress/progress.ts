import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'w-full overflow-hidden rounded-md',
  variants: {
    size: {
      sm: 'h-[2px]',
      md: 'h-[4px]',
    },
    error: {
      true: 'bg-error',
    },
    background: {
      transparent: 'bg-transparent',
      theme: 'bg-skeleton',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'transparent',
  },
})

export const progress = tv({
  base: 'h-full',
  variants: {
    color: {
      default: 'bg-foreground',
      primary: 'bg-primary',
      error: 'bg-error',
      'primary-light': 'bg-primary-light',
      success: 'bg-green-400',
    },
    infinite: {
      true: 'animate-indeterminate-bar',
      false: '',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})
