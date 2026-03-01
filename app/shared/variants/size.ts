import { tv } from 'tailwind-variants'

export const sizeVariants = tv({
  variants: {
    size: {
      sm: 'h-8',
      md: 'h-9',
      lg: 'h-10',
      xl: 'h-11',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})
