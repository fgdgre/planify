import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { applyInlineScriptHashes } from "./scripts/csp-inline-hashes.mjs";

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
  modules: ['@nuxt/icon', '@pinia/nuxt', '@vueuse/nuxt'],
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
  hooks: {
    // Netlify CSP: `nuxt generate` writes one inline bootstrap <script> into
    // every page whose content changes per build. Hash it into the
    // Content-Security-Policy of public/_headers so `script-src` stays strict
    // without 'unsafe-inline'. In `nuxt generate` this hook runs after
    // prerendering (HTML exists) and right after public/ was copied
    // (_headers exists).
    async 'nitro:build:public-assets'(nitro) {
      const hashes = await applyInlineScriptHashes(nitro.options.output.publicDir)
      nitro.logger.info(`CSP: injected ${hashes.length} inline script hash(es) into _headers`)
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
})
