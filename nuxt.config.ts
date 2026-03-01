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
      supabaseUrl: 'https://piqouitlhtmlnvyzvftd.supabase.co',
      supabaseAnonKey: 'sb_publishable_EQJgRCTmvKOr8-92aWX6AA_BA8W09oa',
    },
  },

  supabase: {
    types: '~~/shared/types/database.types.ts',
    redirect: false,
  },
})