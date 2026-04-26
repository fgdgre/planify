import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'flex flex-col w-[80%] max-w-[370px] h-[100dvh] box-border fixed top-0 z-30 border-r border-border',
  variants: {
    open: {
      true: '',
      false: '',
    },
    theme: {
      white: 'bg-background text-foreground',
      black: 'bg-sidebar-background text-sidebar-foreground',
    },
    position: {
      left: 'border-border border-r',
      right: 'border-border border-l',
    },
  },
  defaultVariants: {
    theme: 'white',
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
  base: 'flex items-center justify-between h-8 p-4 pr-2 box-content transition-all pt-4',
  variants: {
    theme: {
      white: 'text-foreground',
      black: 'text-sidebar-foreground',
    },
    open: {
      true: 'px-2 w-[32px]',
      false: '',
    },
  },
  defaultVariants: {
    theme: 'white',
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

export const groupItem = tv({
  base: 'flex items-center hover:bg-sidebar-foreground/10 rounded-md cursor-pointer select-none transition-colors pointer-events-auto font-display w-full bg-transparent text-sidebar-foreground p-2 hover:bg-sidebar-foreground/10 justify-start text-sm gap-2 outline-none focus-visible:[box-shadow:inset_0_0_0_1px] mt-1',
  variants: {
    subListItem: {
      true: 'py-0 h-[28px]',
      false: '',
    },
    activeItem: {
      true: 'bg-sidebar-foreground/20 text-white  hover:bg-sidebar-foreground/20',
      false: '',
    },
    wrap: {
      true: '',
      false: 'text-nowrap h-8 py-1',
    },
  },
})
