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
    public: {},
  },

  supabase: {
    url: 'https://piqouitlhtmlnvyzvftd.supabase.co',
    key: 'sb_publishable_EQJgRCTmvKOr8-92aWX6AA_BA8W09oa',
    types: '~~/shared/types/database.types.ts',
    redirect: false,
  },
})