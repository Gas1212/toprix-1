import type { Metadata } from 'next'
import { getMarque } from '@/lib/api/marques'
import { getProduits } from '@/lib/api/produits'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import FilteredProductsSection from '@/components/product/FilteredProductsSection'
import FAQSection from '@/components/ui/FAQSection'
import { getFAQsForBrand, buildFaqJsonLd } from '@/lib/faq-utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{
    page?: string
    boutique?: string
    tri?: string
    prix_min?: string
    prix_max?: string
    en_promo?: string
    en_stock?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const name = slug.join('/')
  try {
    const res = await getMarque(name)
    const marque = (res as any).marque ?? res
    const title = `${marque.nom.toUpperCase()} – Produits au meilleur prix en Tunisie`
    const description = `Découvrez tous les produits ${marque.nom} en Tunisie. Comparez les prix sur Mytek, Tunisianet et Spacenet pour trouver les meilleures offres.`
    return {
      title,
      description,
      alternates: { canonical: `/marque/${name}` },
      openGraph: { title, description, type: 'website' },
    }
  } catch {
    return { title: 'Marque introuvable' }
  }
}

export default async function MarqueDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const name = slug.join('/')
  const {
    page = '1',
    boutique = '',
    tri = '',
    prix_min = '',
    prix_max = '',
    en_promo = '',
    en_stock = '',
  } = await searchParams

  let marque: any = null
  let produits = null

  try {
    const res = await getMarque(name)
    // L'API retourne { data, meta, marque: { slug, nom } }
    marque = (res as any).marque ?? res
  } catch { notFound() }
  try {
    produits = await getProduits({
      marque: name,
      page: Number(page),
      boutique: boutique || undefined,
      tri: tri || undefined,
      prix_min: prix_min ? Number(prix_min) : undefined,
      prix_max: prix_max ? Number(prix_max) : undefined,
      en_promo: en_promo === '1',
      en_stock: en_stock === '1',
    })
  } catch {}

  if (!marque) notFound()

  const nbResultats = produits?.meta?.total_items ?? produits?.data.length ?? 0
  const faqs = getFAQsForBrand(marque.nom)
  const faqJsonLd = buildFaqJsonLd(faqs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <div>
      {/* Hero marque */}
      <section className="bg-[#0F172A] py-8 px-4 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-64 h-64 bg-[#F97316] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">

          {/* Breadcrumb + bouton retour */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/marque"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all shrink-0"
              aria-label="Retour aux marques"
            >
              <ChevronLeft size={16} />
            </Link>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-300 transition-colors">Accueil</Link>
              <ChevronRight size={12} />
              <Link href="/marque" className="hover:text-slate-300 transition-colors">Marques</Link>
              <ChevronRight size={12} />
              <span className="text-slate-300 font-medium">{marque.nom}</span>
            </nav>
          </div>

          {/* Titre marque */}
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#F1F5F9' }}>
            Produits {marque.nom} – au meilleur prix en Tunisie
          </h1>
          <p className="mt-2 text-slate-400 text-sm leading-relaxed max-w-2xl">
            Comparez les prix <span className="text-white font-medium">{marque.nom}</span> entre les principales boutiques en ligne tunisiennes. Trouvez la meilleure offre parmi {nbResultats > 0 ? `${nbResultats} produit${nbResultats > 1 ? 's' : ''}` : 'les produits'} disponibles.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FilteredProductsSection
          initialProducts={produits?.data ?? []}
          initialMeta={produits?.meta ?? null}
          fixedMarque={name}
          initialFilters={{
            boutique,
            tri,
            prix_min,
            prix_max,
            en_promo: en_promo === '1',
            en_stock: en_stock === '1',
          }}
          hideBrand={true}
          hideCategorie={false}
        />

        <FAQSection faqs={faqs} />
      </div>
    </div>
    </>
  )
}
