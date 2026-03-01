import { defineStore } from "pinia";

export const useUserStore = defineStore('user', () => {
  const user = null

  const isAuthenticated = true

  return {
    user,
    isAuthenticated,
  }
})