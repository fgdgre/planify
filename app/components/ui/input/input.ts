import { tv } from 'tailwind-variants'
import { sizeVariants } from '~/shared/variants/size'

export const wrapper = tv({
  base: 'flex flex-col relative w-full',
  variants: {
    disabled: {
      true: 'opacity-70 select-none',
    },
  },
})

export const inputField = tv({
  extend: sizeVariants,
  base: 'px-3 py-1 bg-transparent rounded-md border border-border text-base md:text-sm font-normal placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus text-foreground w-full',
  variants: {
    disabled: {
      true: 'cursor-not-allowed select-none',
    },
    error: {
      true: 'border-error text-error placeholder:text-error/70 focus-visible:ring-error',
      false: '',
    },
    padding: {
      leading: 'pl-10',
      trailing: 'pr-10',
      both: 'px-10',
    },
    readonly: {
      true: 'focus-visible:ring-0 cursor-default opacity-50',
      false: '',
    },
    noShadow: {
      true: '',
      false: 'input-shadow',
    },
  },
})

export const label = tv({
  base: 'flex text-sm font-medium leading-none text-foreground select-none cursor-pointer',
  variants: {
    disabled: {
      true: 'cursor-not-allowed',
    },
    error: {
      true: 'text-error',
      false: '',
    },
    checkboxType: {
      true: 'ml-2',
      false: 'mb-2',
    },
  },
})

export const errorMessage = tv({
  base: 'text-error text-xs mt-2 text-start',
})

export const icon = tv({
  base: 'size-6 text-placeholder',
  variants: {
    error: {
      true: 'text-error/70',
      false: '',
    },
  },
})

export const absoluteWrappper = tv({
  base: 'absolute top-[50%] translate-y-[-50%] h-full w-10 flex items-center justify-center pointer-events-none overflow-hidden',
  variants: {
    position: {
      left: 'left-0',
      right: 'right-0',
    },
    disabled: {
      true: 'pointer-events-none!',
      false: '',
    },
  },
})
