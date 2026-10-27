'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT } from '@/lib/ads'

interface Props {
  /** data-ad-slot du bloc créé dans la console AdSense. Vide = rien n'est rendu. */
  slot: string
  /**
   * true quand le bloc est inséré entre deux rangées d'une grille de produits :
   * ajoute tp-ad--grid pour qu'il occupe toute la largeur sans désaligner les
   * cartes. Le conteneur parent doit être la grille elle-même.
   */
  inGrid?: boolean
  className?: string
}

export default function AdSlot({ slot, inGrid = false, className = '' }: Props) {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    const el = insRef.current
    if (!el) return

    const push = (): boolean => {
      if (pushed.current) return true

      // Un <ins> déjà servi porte data-adsbygoogle-status. Re-pusher dessus lève
      // « All ins elements ... already have ads in them » — cas du double effet
      // en StrictMode et des remontages lors des navigations client.
      if (el.getAttribute('data-adsbygoogle-status')) {
        pushed.current = true
        return true
      }

      // Pousser sur un élément de largeur nulle produit le TagError
      // « No slot size for availableWidth=0 ». On attend une largeur mesurable.
      if (el.offsetWidth === 0) return false

      try {
        const w = window as unknown as { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle || []
        w.adsbygoogle.push({})
      } catch {
        // AdSense bloqué (adblock) ou script non chargé : inutile de réessayer.
      }
      pushed.current = true
      return true
    }

    if (push()) return

    // Largeur encore nulle au montage : on attend que le conteneur soit mesuré.
    const observer = new ResizeObserver(() => {
      if (push()) observer.disconnect()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!slot) return null

  // La hauteur réservée et le repli quand l'annonce n'est pas servie sont gérés
  // par .tp-ad dans globals.css.
  const classes = ['tp-ad', inGrid ? 'tp-ad--grid' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
