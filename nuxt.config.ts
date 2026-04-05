import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const alias = {
  "@features": resolve(__dirname, "app/features"),
  "@entities": resolve(__dirname, "app/entities"),
  "@shared": resolve(__dirname, "app/shared"),
  "@assets": resolve(__dirname, "app/assets"),
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
    // @ts-expect-error
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
    clientOptions: {
      auth: {
        // Implicit flow: confirmation emails carry ?token_hash= instead of ?code=,
        // so no PKCE code verifier is needed in storage.
        // This fixes confirmation links opened in Gmail webviews / new browser tabs.
        flowType: 'implicit',
      },
    },
  },
})
