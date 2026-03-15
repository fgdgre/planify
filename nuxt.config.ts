import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";


const alias = {
  "@modules": resolve(__dirname, "app/modules"),
  "@integrations": resolve(__dirname, "app/modules/integrations"),
  "@ui": resolve(__dirname, "app/shared/ui"),
  "@constants": resolve(__dirname, "app/shared/constants"),
  "@css": resolve(__dirname, "app/assets/css"),
  "@images": resolve(__dirname, "app/assets/images"),
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/icon', '@pinia/nuxt', '@nuxtjs/supabase', '@vueuse/nuxt'],
  alias,
  vite: {
    plugins: [tailwindcss()],
  },
  components: [
    {
      path: '~/shared/ui',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
    },
  ],
  runtimeConfig: {
    public: {
      BASE_URL: process.env.NUXT_PUBLIC_API_BASE,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  supabase: {
    url: 'https://piqouitlhtmlnvyzvftd.supabase.co',
    key: 'sb_publishable_EQJgRCTmvKOr8-92aWX6AA_BA8W09oa',
    types: '~~/shared/types/database.types.ts',
    redirect: false,
  },
})
