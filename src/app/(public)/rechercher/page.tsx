import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { getProduits } from '@/lib/api/produits'
import FilteredProductsSection from '@/components/product/FilteredProductsSection'
import { AD_SLOTS } from '@/lib/ads'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rechercher',
  description: 'Recherchez et comparez les prix des produits high-tech en Tunisie.',
  robots: { index: false, follow: true },
}

interface Props {
  searchParams: Promise<{
    q?: string
    page?: string
    categorie?: string
    marque?: string
    prix_min?: string
    prix_max?: string
    en_promo?: string
    boutique?: string
    en_stock?: string
    tri?: string
  }>
}

export default async function RechercherPage({ searchParams }: Props) {
  const params = await searchParams
  const {
    q = '',
    page = '1',
    categorie = '',
    marque = '',
    prix_min = '',
    prix_max = '',
    en_promo = '',
    boutique = '',
    en_stock = '',
    tri = '',
  } = params

  const marques = marque.split(',').filter(Boolean)
  const hasSearch = !!(q || categorie || marque || prix_min || prix_max || en_promo === '1' || boutique || en_stock === '1')

  let produits = null
  let erreur = null

  if (hasSearch) {
    try {
      produits = await getProduits({
        q,
        page: Number(page),
        categorie,
        marque: marques.length > 0 ? marques : undefined,
        prix_min: prix_min ? Number(prix_min) : undefined,
        prix_max: prix_max ? Number(prix_max) : undefined,
        en_promo: en_promo === '1',
        boutique: boutique || undefined,
        en_stock: en_stock === '1',
        tri: tri || undefined,
      })
    } catch {
      erreur = 'Impossible de charger les résultats.'
    }
  }

  return (
    <div>
      {/* Hero recherche */}
      <section className="bg-[#0F172A] py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-3">Comparateur</p>
          <form method="get" className="flex items-center bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 flex-1 px-5">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Ex : PC portable, iPhone, casque..."
                autoFocus
                className="w-full py-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold text-sm px-6 py-4 transition-colors"
            >
              Comparer
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {!hasSearch && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-4">
              <Search size={28} className="text-slate-300" />
            </div>
            <p className="font-heading text-[#0F172A] text-xl font-semibold mb-2">Que recherchez-vous ?</p>
            <p className="text-[#64748B] text-sm">Entrez le nom d&apos;un produit pour comparer les prix.</p>
          </div>
        )}

        {erreur && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mt-6">{erreur}</div>
        )}

        {hasSearch && !erreur && (
          <FilteredProductsSection
            initialProducts={produits?.data ?? []}
            initialMeta={produits?.meta ?? null}
            fixedQ={q}
            initialFilters={{
              boutique,
              categorie,
              marques,
              prix_min,
              prix_max,
              en_promo: en_promo === '1',
              en_stock: en_stock === '1',
              tri,
            }}
            adSlot={AD_SLOTS.rechercheMilieu}
            adApres={5}
            hideBrand={false}
            hideCategorie={false}
            showQ={q}
          />
        )}
      </div>
    </div>
  )
}
