import { defineStore } from "pinia";

export const useUserStore = defineStore("user", () => {
  // FIXME: type this with tyoes from supabase
  const authUser = ref<any | null>(null)
  const profile = ref<any | null>(null)

  const authReady = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!authUser.value)

  const setAuthUser = (value: any | null) => { authUser.value = value }
  const setProfile = (value: any | null) => { profile.value = value }
  const setAuthReady = (v: boolean) => { authReady.value = v }
  const setLoading = (v: boolean) => { loading.value = v }
  const setClear = () => {
    authUser.value = null
    profile.value = null
    authReady.value = false
    loading.value = false
  }

  return {
    authUser,
    profile,
    authReady,
    loading,
    isAuthenticated,
    setAuthUser,
    setProfile,
    setAuthReady,
    setLoading,
    setClear,
  }
})