export const useSupabaseSession = () => {
  const { $supabase } = useNuxtApp()
  const session = useState('sb_session', () => null as any)

  onMounted(async () => {
    session.value = (await $supabase.auth.getSession()).data.session
    $supabase.auth.onAuthStateChange((_event, s) => {
      session.value = s
    })
  })

  return { session }
}