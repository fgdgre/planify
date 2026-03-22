export type SidebarSectionLink = {
  pageName: string
  name: string
  link?: string
  icon?: string
  open?: boolean
  links?: SidebarSectionLink[] // Nested links
}

export type SidebarSection = {
  groupTitle?: string
  name: string
  pageName?: string
  link?: string
  icon?: string
  open?: boolean
  links?: SidebarSectionLink[] // Array of nested links
}
