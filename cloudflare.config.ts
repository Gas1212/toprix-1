import { bindings, defineConfig, defineWorker } from 'cf/config'
import { createWorkersCacheConfig } from '@vinext/cloudflare/cache/config'

/**
 * Source de vérité du déploiement Cloudflare (cf + Cloudflare Vite plugin v2).
 *
 * createWorkersCacheConfig() fournit les entrypoints de l'étage réponse
 * (VinextCachedResponse / VinextUncachedResponse), la politique de cache et le
 * binding de métadonnées de version : un hit de cache n'exécute alors pas
 * l'étage applicatif.
 *
 * La date de compatibilité est postérieure au 2026-08-04, donc nodejs_compat et
 * nodejs_compat_v2 sont actifs par défaut — nécessaires à nodemailer, qui ouvre
 * une socket TCP via node:net pour le SMTP.
 */
const workersCache = await createWorkersCacheConfig()

export default defineConfig({
  worker: defineWorker({
    name: 'toprix',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-11-02',
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    ...workersCache,
    env: {
      ASSETS: bindings.assets(),
      ...workersCache.env,
    },
  }),
})
