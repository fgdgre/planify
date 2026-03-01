import { tv } from 'tailwind-variants'
import * as inputVariants from '~/components/ui/input/input'

export const wrapper = tv({
  base: 'flex flex-col relative w-full',
  variants: {
    disabled: {
      true: 'opacity-70 select-none',
    },
  },
})

export const label = inputVariants.label

export const textareaField = tv({
  extend: inputVariants.inputField,
  base: 'scrollbar-thin scrollbar-muted',
  variants: {
    resizable: {
      true: '',
      false: 'resize-none',
    },
    size: {
      sm: 'h-22',
      md: 'h-25',
      lg: 'h-27',
      xl: 'h-30',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const errorMessage = inputVariants.errorMessage
