import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex flex-col bg-modal text-sidebar-foreground w-[80%] max-w-[370px] h-[100dvh] box-border fixed top-0 z-30 border-r border-border text-sidebar-foreground',
  variants: {
    open: {
      true: '',
      false: '',
    },
    position: {
      left: 'border-border border-r',
      right: 'border-border border-l',
    },
  },
  compoundVariants: [
    {
      open: false,
      position: 'left',
      class: '-left-full',
    },
    {
      open: true,
      position: 'left',
      class: 'left-0',
    },
    {
      open: false,
      position: 'right',
      class: '-right-full',
    },
    {
      open: true,
      position: 'right',
      class: 'right-0',
    },
  ],
})

export const overlay = tv({
  base: 'z-20 fixed inset-0 transition-opacity bg-black/50 w-full h-full',
})

export const title = tv({
  base: 'flex items-center justify-between text-sidebar-foreground h-8 p-4 pr-2 box-content transition-all pt-4',
  variants: {
    open: {
      true: 'px-2 w-[32px]',
      false: '',
    },
  },
})

export const mainContent = tv({
  base: 'flex-1 overflow-y-auto p-2',
  variants: {
    noPadding: {
      true: 'p-0',
      false: '',
    },
  },
})

export const footerWrapper = tv({
  base: 'flex items-end box-content',
  variants: {
    self: {
      true: 'flex-1',
      false: '',
    },
  },
})

export const footer = tv({
  base: 'flex items-center text-foreground h-8 p-2 box-content overflow-hidden w-full',
})
