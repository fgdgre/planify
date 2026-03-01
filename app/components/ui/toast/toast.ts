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
    },
  },
})
