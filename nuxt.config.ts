import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import type { NuxtApp } from "nuxt/app";


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
  app: {
    head: {
      meta: [
        {
          name: 'google-site-verification',
          content: 'hK8Q58PtqRswdFTHd_O41F8N2hRr0FEbJp4GMWquTv8'
        }
      ]
    }
  },
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
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    types: '~~/shared/types/database.types.ts',
    redirect: false,
  },
})
