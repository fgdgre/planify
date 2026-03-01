import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'text-foreground flex flex-col fixed z-40',
  variants: {
    fullscreen: {
      true: 'left-0 top-0 h-full w-full bg-background',
      false:
        'border border-border bg-modal items-center justify-center max-h-[calc(100%-8rem)] w-[calc(100%-32px)] max-w-[350px] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-md',
    },
  },
})

export const wrapperTitle = tv({
  base: 'flex w-full items-center text-lg gap-2 p-4 pb-0',
})

export const mainContent = tv({
  base: 'w-full flex-1 flex flex-col',
  variants: {
    scrollable: {
      true: 'overflow-y-auto scrollbar-muted scrollbar-thin',
      false: 'overflow-hidden',
    },
    smallModal: {
      true: 'px-4 text-muted-foreground',
      false: '',
    },
    withFooter: {
      true: 'pb-2',
      false: 'pb-4',
    },
    withHeader: {
      true: 'pt-0',
      false: 'pt-4',
    },
    fullscreen: {
      true: 'p-0',
      false: '',
    },
  },
})

export const footer = tv({
  base: 'flex w-full gap-x-3 px-4 pt-2 pb-3 justify-end',
})

export const backdrop = tv({
  base: 'z-30 fixed inset-0 transition-opacity bg-black/80 w-full h-full',
})
