import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { workersCacheCdnAdapter } from '@vinext/cloudflare/cache/workers-cache-cdn-adapter'

/**
 * Build vinext pour Cloudflare Workers.
 *
 * vinext réimplémente l'API Next sur Vite ; next.config.ts reste lu pour les
 * rewrites et la config images, et aucun import next/* n'est à réécrire.
 *
 * Le plugin RSC est enregistré automatiquement par vinext pour l'App Router :
 * l'ajouter ici ferait échouer le build sur « Duplicate @vitejs/plugin-rsc ».
 */
export default defineConfig({
  plugins: [
    vinext({
      // Cache de page servi par le Workers Cache de Cloudflare. Sans effet tant
      // que les pages restent en force-dynamic / no-store, mais l'adaptateur est
      // en place pour le jour où elles deviendront cachables.
      cache: { cdn: workersCacheCdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
})
