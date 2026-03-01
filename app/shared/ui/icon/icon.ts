import { tv } from 'tailwind-variants'

export const icon = tv({
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-5',
      md: 'size-6',
      lg: 'size-7',
      xl: 'size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})
