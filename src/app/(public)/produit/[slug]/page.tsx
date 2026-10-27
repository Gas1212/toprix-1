import type { Metadata } from 'next'
import { getProduit, getProduits } from '@/lib/api/produits'
import type { Produit } from '@/types'
import { notFound } from 'next/navigation'
import CarteProduit from '@/components/product/CarteProduit'
import AdSlot from '@/components/ads/AdSlot'
import { AD_SLOTS } from '@/lib/ads'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight, ExternalLink, Tag, Wrench,
  CheckCircle, XCircle, Hash, Store, Barcode,
} from 'lucide-react'

const STORE_LOGOS: Record<string, string> = {
  mytek:      '/stores/mytek.png',
  tunisianet: '/stores/tunisianet.png',
  spacenet:   '/stores/spacenet.png',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const produit = await getProduit(slug)
    const title = `${produit.nom} - ${produit.marque} | Toprix`
    const description = produit.description
      || `Comparez le prix de ${produit.nom} (${produit.marque}) sur Mytek, Tunisianet et Spacenet. Trouvez la meilleure offre en Tunisie.`
    return {
      title,
      description,
      alternates: { canonical: `/produit/${slug}` },
      openGraph: {
        title,
        description,
        type: 'website',
        images: produit.image ? [{ url: produit.image, alt: produit.nom }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: produit.image ? [produit.image] : [],
      },
    }
  } catch {
    return { title: 'Produit introuvable' }
  }
}

const STORE_COLORS: Record<string, string> = {
  mytek:      'bg-blue-50 text-blue-600 border-blue-100',
  tunisianet: 'bg-green-50 text-green-600 border-green-100',
  spacenet:   'bg-purple-50 text-purple-600 border-purple-100',
}

export default async function ProduitDetailPage({ params }: Props) {
  const { slug } = await params
  let produit: Produit | null = null
  try { produit = await getProduit(slug) } catch { notFound() }
  if (!produit) notFound()

  // Produits similaires (même catégorie, hors produit courant)
  let similaires: Produit[] = []
  if (produit.categorie) {
    try {
      const res = await getProduits({ categorie: produit.categorie })
      similaires = (res.data ?? []).filter(p => p.id !== produit!.id).slice(0, 4)
    } catch { /* ignore */ }
  }

  const hasDiscount = (produit.discount ?? 0) > 0
  const hasOldPrice = !!(produit.prix_max && produit.prix_min && produit.prix_max > produit.prix_min)
  const storeKey = (produit.boutique ?? '').toLowerCase()
  const storeClass = STORE_COLORS[storeKey] ?? 'bg-slate-50 text-slate-500 border-slate-100'

  const RETURN_URLS: Record<string, string> = {
    mytek:      'https://www.mytek.tn/expedition-retours',
    tunisianet: 'https://www.tunisianet.com.tn/content/1-livraison',
    spacenet:   'https://spacenet.tn/content/17-expedition-livraison',
  }

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: produit.nom,
    image: produit.image || undefined,
    description: produit.description || `${produit.nom} - ${produit.marque}`,
    sku: produit.reference || undefined,
    brand: { '@type': 'Brand', name: produit.marque },
    category: produit.categorie_nom || produit.categorie,
    offers: (produit.offres && produit.offres.length > 0
      ? produit.offres
      : produit.prix_min ? [{ boutique: produit.boutique || '', prix: produit.prix_min, stock: produit.en_stock ? 'En stock' : '', url: produit.url_boutique || '' }]
      : []
    ).map((o) => ({
      '@type': 'Offer',
      url: o.url,
      priceCurrency: 'TND',
      price: o.prix,
      priceValidUntil: '2026-12-31',
      availability: o.stock === 'En stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        applicableCountry: 'TN',
        returnPolicyUrl: RETURN_URLS[o.boutique?.toLowerCase() || ''] || 'https://toprix.tn',
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://toprix.tn' },
      ...(produit.categorie ? [
        { '@type': 'ListItem', position: 2, name: produit.categorie_nom || produit.categorie, item: `https://toprix.tn/categories/${produit.categorie}` },
        { '@type': 'ListItem', position: 3, name: produit.nom, item: `https://toprix.tn/produit/${slug}` },
      ] : [
        { '@type': 'ListItem', position: 2, name: produit.nom, item: `https://toprix.tn/produit/${slug}` },
      ]),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div>
      {/* Breadcrumb */}
      <section className="bg-[#0F172A] py-5 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition-colors">Accueil</Link>
            <ChevronRight size={12} />
            {produit.categorie ? (
              <>
                <Link href={`/categories/${produit.categorie}`} className="hover:text-slate-300 transition-colors">
                  {produit.categorie_nom || produit.categorie}
                </Link>
                <ChevronRight size={12} />
              </>
            ) : (
              <>
                <Link href="/categories" className="hover:text-slate-300 transition-colors">Catégories</Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-slate-300 truncate max-w-xs">{produit.nom}</span>
          </nav>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Image */}
          <div className="relative">
            <div className="relative h-72 md:h-96 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden flex items-center justify-center">
              {produit.image ? (
                <Image
                  src={produit.image}
                  alt={produit.nom}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-200">
                  <Wrench size={48} />
                  <p className="text-sm text-slate-400">Image non disponible</p>
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-3 left-3 bg-[#F97316] text-white text-sm font-bold px-3 py-1 rounded-lg">
                  -{produit.discount} DT
                </span>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="space-y-5">

            {/* Badges haut */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#F97316]/10 text-[#F97316] text-xs font-semibold px-2.5 py-1 rounded-full">
                <Tag size={10} />
                {produit.marque}
              </span>
              {produit.categorie && (
                <span className="text-xs text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                  {produit.categorie_nom || produit.categorie}
                </span>
              )}
              {produit.boutique && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${storeClass}`}>
                  <Store size={10} />
                  {produit.boutique}
                </span>
              )}
              {produit.en_stock !== undefined && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${produit.en_stock ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                  {produit.en_stock
                    ? <><CheckCircle size={10} /> En stock</>
                    : <><XCircle size={10} /> Rupture</>}
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="font-heading text-[#0F172A] text-2xl md:text-3xl font-bold leading-tight">
              {produit.nom}
            </h1>

            {/* SKU / Référence */}
            {produit.reference && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Barcode size={15} className="shrink-0 text-[#94A3B8]" />
                <span>SKU :</span>
                <code className="font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#1E293B] text-xs tracking-wider">
                  {produit.reference}
                </code>
                <Hash size={12} className="text-[#CBD5E1]" />
                <span className="text-xs text-[#94A3B8]">{produit.id}</span>
              </div>
            )}

            {/* Prix */}
            {produit.prix_min && (
              <div className="bg-[#0F172A] rounded-2xl p-5">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Prix</p>
                <div className="flex items-end gap-3 flex-wrap">
                  {hasOldPrice && (
                    <p className="text-slate-500 text-xl line-through">
                      {produit.prix_max} DT
                    </p>
                  )}
                  <p className="font-heading text-[#F97316] text-4xl font-bold">
                    {produit.prix_min} DT
                  </p>
                </div>
                {hasDiscount && (
                  <p className="text-green-400 text-sm font-semibold mt-2">
                    Économie : {produit.discount} DT
                  </p>
                )}
              </div>
            )}

            {/* Lien direct boutique (produit per-store) */}
            {produit.url_boutique && (
              <a
                href={produit.url_boutique}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Voir sur {produit.boutique || 'le site'}
                <ExternalLink size={14} />
              </a>
            )}

            {/* Description / Fiche technique */}
            {produit.description && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                  Fiche technique
                </p>
                <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-line">
                  {produit.description}
                </p>
              </div>
            )}

            {/* Tableau comparaison boutiques */}
            {produit.offres && produit.offres.length > 0 && (
              <div>
                <h2 className="font-heading text-[#0F172A] text-base font-semibold mb-3">
                  Comparer les offres
                  <span className="ml-2 text-xs font-normal text-[#64748B]">
                    ({produit.offres.length} boutique{produit.offres.length > 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    <span>Boutique</span>
                    <span className="text-center">Prix</span>
                    <span className="text-right">Action</span>
                  </div>
                  {produit.offres.map((offre, i) => {
                    const logoKey = offre.boutique.toLowerCase()
                    const logo = STORE_LOGOS[logoKey]
                    const storeRowClass = STORE_COLORS[logoKey] ?? 'bg-slate-50 text-slate-500 border-slate-100'
                    return (
                      <div
                        key={offre.boutique}
                        className={`grid grid-cols-3 items-center px-4 py-4 text-sm ${i === 0 ? 'bg-orange-50/40' : ''} ${i < produit.offres!.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                      >
                        {/* Boutique : logo + nom + stock */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {logo ? (
                              <Image src={logo} alt={offre.boutique} width={50} height={14}
                                style={{ height: '14px', width: 'auto' }}
                                className="object-contain"
                              />
                            ) : null}
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${storeRowClass}`}>
                              {offre.boutique}
                            </span>
                          </div>
                          {offre.stock && (
                            <p className="text-xs text-[#64748B] flex items-center gap-1">
                              {offre.stock === 'En stock'
                                ? <><CheckCircle size={10} className="text-green-500" /> En stock</>
                                : <><XCircle size={10} className="text-red-400" /> {offre.stock}</>}
                            </p>
                          )}
                        </div>

                        {/* Prix */}
                        <div className="text-center">
                          <span className={`text-lg font-bold ${i === 0 ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
                            {offre.prix} DT
                          </span>
                          {i === 0 && produit.offres!.length > 1 && (
                            <p className="text-[10px] text-[#F97316] font-medium">✓ Meilleur prix</p>
                          )}
                        </div>

                        {/* Bouton */}
                        <div className="flex justify-end">
                          <a
                            href={offre.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-[#F97316] hover:bg-[#EA6C0A] text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Voir <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── tp-produit-bas ── sous le tableau comparatif, au-dessus des
            produits similaires. Seul bloc AdSense de cette page. */}
        <AdSlot slot={AD_SLOTS.produitBas} />

        {/* ── Produits similaires ── */}
        {similaires.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[#E2E8F0]">
            <h2 className="font-heading text-[#0F172A] text-lg font-semibold mb-5">
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {similaires.map((p) => (
                <CarteProduit key={p.id} produit={p} compact />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  )
}
