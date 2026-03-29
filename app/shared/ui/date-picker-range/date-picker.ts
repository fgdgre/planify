import { tv } from "tailwind-variants";

export const datePickerWrapperUi = tv({
  base: 'w-fit',
})

export const datePickerInputUi = tv({
  base: 'flex select-none items-center justify-between text-center min-w-[160px] w-full gap-4 tabular-nums',
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none',
    },
    readonly: {
      true: 'opacity-70',
    },
    noShadow: {
      true: '',
      false: 'input-shadow',
    },
  },
})

export const datePickerInputDataUi = tv({
  base: 'flex items-center',
  variants: {
    placeholder: {
      true: 'data-[placeholder]:text-placeholder',
      false: '',
    },
    error: {
      true: 'text-error data-[placeholder]:text-error/50',
      false: '',
    },
  },
})

export const datePickerTriggerButtonUi = tv({
  base: 'focus:outline-none p-1 px-3 cursor-pointer text-placeholder flex gap-4 items-center justify-between w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus border border-border rounded-md',
  variants: {
    error: {
      true: 'border-error text-error focus-visible:ring-error',
      false: '',
    },
  },
})

export const datePickerMenuUi = tv({
  base: 'rounded-xl bg-modal border border-border shadow-md will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade ',
})

export const datePickerMenuItemUi = tv({
  // data-[disabled]:opacity-30 data-[disabled]:hover:bg-modal data-[disabled]:cursor-default
  base: 'flex items-center cursor-pointer text-foreground justify-center rounded-[9px] w-8 h-8 active:scale-98 active:transition-all hover:bg-foreground/10 transition-colors',
  variants: {
    ceilTrigger: {
      //  data-[outside-view]:cursor-pointer data-[outside-view]:opacity-100
      true: 'shadow-xs shadow-transparent relative justify-center whitespace-nowrap text-sm before:absolute before:top-[5px] before:hidden data-[today]:before:block before:rounded-full before:w-1 before:h-1 before:bg-foreground hover:bg-foreground/10 transition-colors cursor-pointer data-[outside-view]:text-foreground/30 data-[selected]:bg-foreground data-[selected]:text-background hover:bg-foreground/10 data-[highlighted]:bg-foreground/10 data-[unavailable]:pointer-events-none data-[unavailable]:text-foreground/30 data-[unavailable]:line-through data-[today]:before:block data-[today]:before:bg-foreground data-[selected]:before:bg-background! ',
      false: '',
    },
  },
})
