export const getUser = async () => {
  const client = useSupabaseClient()

  const { data: sessionData, error: sessionError } = await client.auth.getSession()

  if(sessionError) {
    return { data: null, error: sessionError }
  } else if (sessionData.session) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", sessionData.session.user.id)
      .single()

    return { data, error }
  }

  return { data: null, error: null }
}