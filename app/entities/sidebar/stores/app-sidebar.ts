import type { SidebarSection } from "../types";
import { ROUTES } from "@shared/constants/routes";

export const useAppSidebar = defineStore('sidebar', () => {
  const isSidebarCollapsed = ref(true)

  const sections = ref<SidebarSection[]>([
    {
      name: 'Dashboard',
      pageName: 'Dashboard',
      icon: 'lucide:layout-dashboard',
      link: ROUTES.HOME,
    },
    {
      name: 'Calendar',
      pageName: 'calendar',
      icon: 'lucide:calendar',
      link: ROUTES.CALENDAR,
    },
    {
      name: 'Notes',
      pageName: 'notes',
      icon: 'clarity:note-line',
      link: ROUTES.NOTES,
    },
    {
      name: 'Settings',
      pageName: 'settings',
      icon: 'lucide:settings',
      link: ROUTES.SETTINGS,
    },
  ])

  const toggleSection = ({ name, value }: { name: string; value: boolean }) => {
    sections.value.forEach((s) => {
      if (s.name === name) {
        s.open = value
      }
    })
  }

  const handleSidebarToggle = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  return { isSidebarCollapsed, sections, toggleSection, handleSidebarToggle }
})
