import { NextResponse } from 'next/server'
import { SITE_URL, API_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

interface Marque {
  slug: string
  nombre_produits?: number
}

/**
 * Nombre minimum de produits pour qu'une marque entre dans le sitemap.
 *
 * Mesuré le 29/10/2026 : sur 70 pages marque tirées au hasard, 34 n'avaient
 * que 0 à 3 produits. Les soumettre au crawl ne rapporte rien et dilue le
 * budget d'exploration ; c'est aussi le contenu de faible valeur que
 * sanctionne AdSense. Seuil aligné sur AD_MIN_PRODUITS côté affichage.
 */
const MIN_PRODUITS = 6

export async function GET() {
  const baseUrl = SITE_URL

  try {
    const response = await fetch(`${API_URL}/marques/`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) throw new Error('Failed to fetch marques')

    const { data: marques } = await response.json()

    // L'API ne décode pas le pourcent-encodage du segment d'URL : elle compare la
    // chaîne encodée telle quelle au champ brand. Vérifié le 29/10/2026 —
    // /marques/c'fresh/ répond 200, /marques/c%27fresh/ répond 404. Tout slug qui
    // doit être encodé pour voyager dans une URL est donc injoignable : les 173
    // slugs à espace (6 975 produits), rosières, w&t, black+decker, g&g. Ne pas
    // les soumettre au crawl tant que le backend ne décode pas le segment.
    // Les apostrophes passent (c'fresh, grill'o) : elles sont licites en clair.
    const publiables = ((marques || []) as Marque[]).filter(
      (m) =>
        m?.slug &&
        /^[a-z0-9'-]+$/.test(m.slug) &&
        (m.nombre_produits ?? 0) >= MIN_PRODUITS
    )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publiables.map((m) => `  <url>
    <loc>${baseUrl}/marque/${encodeURIComponent(m.slug)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating brand sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
