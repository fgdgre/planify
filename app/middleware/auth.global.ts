export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  const publicRoutes = ['/login', '/signup', '/confirm']
  const isPublic = publicRoutes.includes(to.path)

  if (!user.value && !isPublic) {
    return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
  }

  // Optional: if logged in, keep them out of login/signup
  if (user.value && (to.path === '/login' || to.path === '/signup')) {
    return navigateTo('/')
  }
})