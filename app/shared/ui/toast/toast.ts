import { tv } from 'tailwind-variants'

export const wrapper = tv({
  base: 'items-start w-full rounded-lg border p-4 border-border gap-x-[10px] shadow-sm bg-modal relative overflow-hidden',
  variants: {
    withIcon: {
      true: 'icon-toast-message-layout',
      false: 'toast-message-layout',
    },
    color: {
      primary: '',
      error: 'bg-error',
      'primary-light': '',
      success: '',
      info: 'bg-white',
    },
  },
})

export const toastHeader = tv({
  base: 'font-medium tracking-tight text-sm',
  variants: {
    color: {
      primary: 'text-foreground',
      error: 'text-[#18181b]',
      'primary-light': 'text-foreground',
      success: 'text-foreground',
      info: 'text-[#18181b]',
    },
  },
})

export const toastParagraph = tv({
  base: 'text-foreground-muted text-sm col-end-[-1] row-start-2',
  variants: {
    withIcon: {
      true: 'col-start-2',
      false: 'col-start-1',
    },
    color: {
      primary: 'text-foreground',
      error: 'text-[#18181b]',
      'primary-light': 'text-foreground',
      success: 'text-foreground',
      info: 'text-[#18181b]',
    },
  },
})

export const toastMeta = tv({
  base: 'flex flex-wrap items-center gap-x-2 text-xs col-end-[-1]',
  variants: {
    withIcon: {
      true: 'col-start-2',
      false: 'col-start-1',
    },
    color: {
      primary: 'text-foreground-muted',
      error: 'text-[#18181b]',
      'primary-light': 'text-foreground-muted',
      success: 'text-foreground-muted',
      info: 'text-[#71717a]',
    },
  },
})

export const iconColor = tv({
  base: '',
  variants: {
    color: {
      primary: 'text-primary',
      error: 'text-[#18181b]',
      'primary-light': 'text-primary-light',
      success: 'text-green-400',
      info: 'text-[#18181b]',
    },
  },
})
