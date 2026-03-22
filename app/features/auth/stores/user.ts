import { defineStore } from "pinia";
import type { User } from "@shared/types/user";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const isAuthenticated = computed(() => !!user.value)
  const initPromise = ref<Promise<void> | null>(null)

  const setUser = (value: User | null) => { user.value = value }
  const setLoading = (v: boolean) => { loading.value = v }
  const setInitPromise = (v: Promise<void> | null) => { initPromise.value = v }
  const setClear = () => {
    user.value = null
    initPromise.value = null
    loading.value = false
  }

  return {
    user,
    loading,
    isAuthenticated,
    initPromise,
    setInitPromise,
    setUser,
    setLoading,
    setClear,
  }
})
