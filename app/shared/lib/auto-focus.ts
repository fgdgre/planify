export const canAutoFocus = (win: Window = window): boolean =>
  win.self === win.top || win.navigator.userActivation?.hasBeenActive === true
