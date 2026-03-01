import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex flex-col rounded-lg border border-border text-foreground p-3 w-full h-min alert-grid-layout items-center',
  variants: {
    color: {
      primary: 'border-primary text-primary',
      error: 'border-error text-error',
      theme: 'border-foreground text-foreground',
      info: '',
    },
    withIcon: {
      true: 'gap-2',
      false: 'gap-y-2',
    },
  },
})

export const message = tv({
  base: 'text-sm col-span-full',
  variants: {
    color: {
      primary: 'border-primary text-primary',
      error: 'border-error text-error',
      theme: 'border-foreground text-foreground',
      info: '',
    },
    withIcon: {
      true: 'col-start-2',
      false: '',
    },
  },
})

export const list = tv({
  base: 'flex flex-col col-start-2',
  variants: {
    withIcon: {
      true: 'col-start-2',
      false: '',
    },
  },
})

export const listItem = tv({
  base: 'list-disc ml-4',
})
