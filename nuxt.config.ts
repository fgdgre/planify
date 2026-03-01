import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/icon', '@pinia/nuxt', '@nuxtjs/supabase', '@vueuse/nuxt'],
  vite: {
    plugins: [tailwindcss()],
  },
  components: [
    {
      path: '~/components/ui',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
    },
    {
      path: '~/components/app',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
    },
  ],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  supabase: {
    types: '~~/shared/types/database.types.ts',
    redirect: false,
  },
})