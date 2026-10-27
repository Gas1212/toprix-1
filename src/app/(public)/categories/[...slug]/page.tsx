import type { Metadata } from 'next'
import { getCategorieDetail } from '@/lib/api/categories'
import { getProduits } from '@/lib/api/produits'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import FilteredProductsSection from '@/components/product/FilteredProductsSection'
import FAQSection from '@/components/ui/FAQSection'
import { getFAQsForCategory, buildFaqJsonLd } from '@/lib/faq-utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{
    page?: string
    marque?: string
    boutique?: string
    prix_min?: string
    prix_max?: string
    en_promo?: string
    en_stock?: string
    tri?: string
  }>
}

const slugToLabel = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const fullSlug = slug.join('/')
  const isSubcat = slug.length >= 2
  try {
    const { categorie } = await getCategorieDetail(fullSlug)
    const title = isSubcat
      ? `${slugToLabel(slug[slug.length - 1])} – ${categorie.nom} au meilleur prix en Tunisie`
      : `${categorie.nom} – Produits au meilleur prix en Tunisie`
    const description = isSubcat
      ? `Découvrez les meilleurs ${slugToLabel(slug[slug.length - 1])} en Tunisie. Comparez les prix ${categorie.nom} sur Mytek, Tunisianet et Spacenet et trouvez la meilleure offre.`
      : `Découvrez tous les produits ${categorie.nom} en Tunisie. Comparez les prix sur Mytek, Tunisianet et Spacenet pour trouver les meilleures offres.`
    return {
      title,
      description,
      alternates: { canonical: `/categories/${fullSlug}` },
      openGraph: { title, description, type: 'website' },
    }
  } catch {
    return { title: 'Catégorie introuvable' }
  }
}

export default async function CategorieDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const {
    page = '1',
    marque = '',
    boutique = '',
    prix_min = '',
    prix_max = '',
    en_promo = '',
    en_stock = '',
    tri = '',
  } = await searchParams

  const fullSlug = slug.join('/')
  const isSubcat = slug.length >= 2
  const marques = marque.split(',').filter(Boolean)
  const hasFilters = !!(marque || boutique || prix_min || prix_max || en_promo === '1' || en_stock === '1')

  let categorie = null
  let produits: any[] = []
  let meta = null

  try {
    if (hasFilters) {
      const [filtered, catDetail] = await Promise.all([
        getProduits({
          categorie: fullSlug,
          page: Number(page),
          marque: marques.length > 0 ? marques : undefined,
          boutique: boutique || undefined,
          prix_min: prix_min ? Number(prix_min) : undefined,
          prix_max: prix_max ? Number(prix_max) : undefined,
          en_promo: en_promo === '1',
          en_stock: en_stock === '1',
          tri: tri || undefined,
        }),
        getCategorieDetail(fullSlug, 1),
      ])
      produits = filtered.data
      meta = filtered.meta ?? null
      categorie = catDetail.categorie
    } else {
      const detail = await getCategorieDetail(fullSlug, Number(page))
      categorie = detail.categorie
      produits = detail.data
      meta = detail.meta ?? null
    }
  } catch {
    notFound()
  }

  if (!categorie) notFound()

  const breadcrumbItems = [
    { name: 'Accueil', url: 'https://toprix.tn' },
    { name: 'Catégories', url: 'https://toprix.tn/categories' },
    ...(isSubcat
      ? [
          { name: slugToLabel(slug[0]), url: `https://toprix.tn/categories/${slug[0]}` },
          { name: categorie.nom, url: `https://toprix.tn/categories/${fullSlug}` },
        ]
      : [{ name: categorie.nom, url: `https://toprix.tn/categories/${fullSlug}` }]
    ),
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  const faqs = getFAQsForCategory(slug)
  const faqJsonLd = buildFaqJsonLd(faqs)

  // Filtrer les produits avec id unique pour le schema ItemList
  const produitsUniques = produits
    .filter((p: any) => p.id)
    .reduce((acc: any[], p: any) => {
      if (!acc.some((x: any) => x.id === p.id)) acc.push(p)
      return acc
    }, [])
    .slice(0, 30)

  const itemListJsonLd = produitsUniques.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categorie.nom,
    numberOfItems: meta?.total_items ?? produits.length,
    itemListElement: produitsUniques.map((p: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.nom,
        url: `https://toprix.tn/produit/${p.id}`,
        ...(p.image ? { image: p.image } : {}),
        ...(p.prix_min != null ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'TND',
            lowPrice: p.prix_min,
            ...(p.prix_max ? { highPrice: p.prix_max } : {}),
            availability: 'https://schema.org/InStock',
          },
        } : {}),
      },
    })),
  } : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
    <div>
      {/* Breadcrumb hero */}
      <section className="bg-[#0F172A] py-8 px-4 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-64 h-64 bg-[#F97316] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap">
            <Link href="/" className="hover:text-slate-300 transition-colors">Accueil</Link>
            <ChevronRight size={12} />
            <Link href="/categories" className="hover:text-slate-300 transition-colors">Catégories</Link>
            {isSubcat && categorie.parent_slug && (
              <>
                <ChevronRight size={12} />
                <Link
                  href={`/categories/${categorie.parent_slug}`}
                  className="hover:text-slate-300 transition-colors capitalize"
                >
                  {categorie.parent_nom ?? categorie.parent_slug.replace(/-/g, ' ')}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-slate-300">{categorie.nom}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#F1F5F9' }}>
            {categorie.nom} : les bons plans de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h1>
          <p className="mt-2 text-slate-400 text-sm leading-relaxed max-w-2xl">
            Comparez les prix de la catégorie <span className="text-white font-medium">{categorie.nom}</span> entre les principales boutiques en ligne tunisiennes. {(meta?.total_items ?? 0) > 0 ? `${meta?.total_items} produit${(meta?.total_items ?? 0) > 1 ? 's' : ''}` : 'Des produits'} à découvrir.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sous-catégories (uniquement pour catégorie parente) */}
        {!isSubcat && categorie.sous_categories && categorie.sous_categories.length > 0 && (
          <div className="pt-8 pb-2">
            <h2 className="font-heading text-[#0F172A] text-lg font-semibold mb-4">Sous-catégories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {categorie.sous_categories.map((sous) => (
                <Link
                  key={sous.id}
                  href={`/categories/${sous.slug}`}
                  className="group flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 hover:border-[#F97316]/40 hover:bg-orange-50/40 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#334155] group-hover:text-[#F97316] truncate transition-colors">
                      {sous.nom}
                    </p>
                    {sous.nombre_produits !== undefined && (
                      <p className="text-[10px] text-[#94A3B8]">{sous.nombre_produits} produits</p>
                    )}
                  </div>
                  <ChevronRight size={12} className="text-[#CBD5E1] group-hover:text-[#F97316] transition-colors shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filtres + produits CSR */}
        <FilteredProductsSection
          initialProducts={produits}
          initialMeta={meta}
          fixedCategorie={fullSlug}
          initialFilters={{
            boutique,
            marques,
            prix_min,
            prix_max,
            en_promo: en_promo === '1',
            en_stock: en_stock === '1',
            tri,
          }}
          hideCategorie={true}
          hideBrand={false}
        />

        <FAQSection faqs={faqs} />
      </div>
    </div>
    </>
  )
}
