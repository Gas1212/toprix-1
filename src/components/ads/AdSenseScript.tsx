'use client'

import { usePathname } from 'next/navigation'
import { ADSENSE_CLIENT } from '@/lib/ads'

// Pages où AdSense est désactivé
// Plus aucune page exclue : /rechercher l'était jusqu'à la pose du bloc
// tp-recherche-milieu, qui a besoin que adsbygoogle.js y soit servi.
const PAGES_SANS_ADS: string[] = []

export default function AdSenseScript() {
  const pathname = usePathname()

  if (PAGES_SANS_ADS.some(p => pathname.startsWith(p))) {
    return null
  }

  // Balise <script> native plutôt que next/script : React 19 la remonte seule
  // dans le <head> et n'ajoute pas l'attribut data-nscript, qu'AdSense refuse
  // (« AdSense head tag doesn't support data-nscript attribute »).
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  )
}
