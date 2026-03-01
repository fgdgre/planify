export const getUser = async () => {
  const supabase = useSupabaseClient()

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if(sessionError) {
    return { data: null, error: sessionError }
  } else if (sessionData.session) {
    return await supabase.auth.getUser()
  }

  return { data: null, error: null }
}