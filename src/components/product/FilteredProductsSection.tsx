'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { SlidersHorizontal, X, Tag, Package, ArrowUpDown } from 'lucide-react'
import CarteProduit from '@/components/product/CarteProduit'
import AdSlot from '@/components/ads/AdSlot'
import Pagination from '@/components/ui/Pagination'
import FilterSidebar, { FilterState, EMPTY_FILTERS, PARENT_CATEGORIES } from '@/components/product/FilterSidebar'
import { getProduits } from '@/lib/api/produits'
import type { Produit, PaginationMeta } from '@/types'

// ─── Constantes boutiques ─────────────────────────────────────────────────────

const BOUTIQUES_BADGE: Record<string, string> = {
  mytek:      'bg-blue-50 text-blue-700',
  tunisianet: 'bg-green-50 text-green-700',
  spacenet:   'bg-violet-50 text-violet-700',
}
const BOUTIQUES_LABEL: Record<string, string> = {
  mytek: 'Mytek', tunisianet: 'Tunisianet', spacenet: 'Spacenet',
}

// ─── Bloc AdSense dans la grille ──────────────────────────────────────────────

/**
 * Rang par défaut après lequel insérer le bloc publicitaire (pages marque et
 * catégories).
 *
 * Le plan de pose demande « après le 8e à 12e produit », entre deux rangées,
 * sans désaligner les cartes. Dans cet intervalle, 12 est la seule valeur
 * divisible par 2, 3 et 4 — les trois largeurs de la grille (mobile, lg, xl).
 * Le bloc tombe donc toujours après une rangée complète, à tous les points de
 * rupture. Avec 8 ou 10, la grille à 3 ou 4 colonnes couperait une rangée.
 *
 * /rechercher impose 5, qui n'est divisible par aucune des trois largeurs :
 * le bloc y laisse des cellules vides en fin de rangée. Voir la prop adApres.
 */
const AD_APRES_DEFAUT = 12

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilteredProductsSectionProps {
  initialProducts: Produit[]
  initialMeta: PaginationMeta | null
  fixedMarque?: string
  fixedCategorie?: string
  fixedQ?: string
  initialFilters?: Partial<FilterState>
  hideBrand?: boolean
  hideCategorie?: boolean
  showQ?: string
  /** data-ad-slot du bloc à insérer dans la grille. Omis = aucun bloc. */
  adSlot?: string
  /**
   * Rang après lequel poser le bloc. Défaut 12 (marque et catégories),
   * 5 sur /rechercher comme demandé par le plan de pose.
   */
  adApres?: number
}

// ─── Helper : construire l'URL sans navigation ────────────────────────────────

function buildUrl(filters: FilterState, page: number, fixedQ?: string): string {
  const sp = new URLSearchParams()
  if (fixedQ) sp.set('q', fixedQ)
  if (filters.boutique) sp.set('boutique', filters.boutique)
  if (filters.categorie) sp.set('categorie', filters.categorie)
  if (filters.marques.length > 0) sp.set('marque', filters.marques.join(','))
  if (filters.prix_min) sp.set('prix_min', filters.prix_min)
  if (filters.prix_max) sp.set('prix_max', filters.prix_max)
  if (filters.en_promo) sp.set('en_promo', '1')
  if (filters.en_stock) sp.set('en_stock', '1')
  if (filters.tri) sp.set('tri', filters.tri)
  if (page > 1) sp.set('page', String(page))
  const qs = sp.toString()
  return qs ? `?${qs}` : window.location.pathname
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FilteredProductsSection({
  initialProducts,
  initialMeta,
  fixedMarque,
  fixedCategorie,
  fixedQ,
  initialFilters = {},
  hideBrand = false,
  hideCategorie = false,
  showQ,
  adSlot,
  adApres = AD_APRES_DEFAUT,
}: FilteredProductsSectionProps) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, ...initialFilters })
  const [products, setProducts] = useState<Produit[]>(initialProducts)
  const [meta, setMeta] = useState<PaginationMeta | null>(initialMeta)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const skipFirst = useRef(true)

  // ── Fetch produits ────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async (f: FilterState, p: number) => {
    setLoading(true)
    try {
      const result = await getProduits({
        q: fixedQ,
        marque: f.marques.length > 0 ? f.marques : fixedMarque,
        categorie: f.categorie || fixedCategorie,
        boutique: f.boutique || undefined,
        prix_min: f.prix_min ? Number(f.prix_min) : undefined,
        prix_max: f.prix_max ? Number(f.prix_max) : undefined,
        en_promo: f.en_promo || undefined,
        en_stock: f.en_stock || undefined,
        tri: f.tri || undefined,
        page: p,
      })
      setProducts(result.data)
      setMeta(result.meta ?? null)
    } catch (err) {
      console.error('[Toprix] Erreur fetch produits:', err)
    } finally {
      setLoading(false)
    }
  }, [fixedQ, fixedMarque, fixedCategorie])

  // ── Debounce sur changement filtres/page ──────────────────────────────────

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
    const t = setTimeout(() => {
      fetchProducts(filters, page)
      try {
        window.history.replaceState(null, '', buildUrl(filters, page, fixedQ))
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [filters, page, fetchProducts, fixedQ])

  // ── Réinitialiser page à 1 lors d'un changement de filtre ─────────────────

  const handleFilterChange = (newFilters: FilterState) => {
    setPage(1)
    setFilters(newFilters)
  }

  // ── Marques disponibles (extraites des produits courants) ─────────────────

  const availableBrands = useMemo(() => {
    const seen = new Set<string>()
    products.forEach(p => { if (p.marque) seen.add(p.marque) })
    return Array.from(seen).sort()
  }, [products])

  // ── Nombre de filtres actifs ──────────────────────────────────────────────

  const nbActifs = [
    filters.boutique,
    filters.categorie,
    filters.marques.length > 0 ? '1' : '',
    (filters.prix_min || filters.prix_max) ? '1' : '',
    filters.en_promo ? '1' : '',
    filters.en_stock ? '1' : '',
  ].filter(Boolean).length

  const hasFilters = nbActifs > 0

  // ── Pagination URL builder ────────────────────────────────────────────────

  const buildPageUrl = (p: number) => buildUrl(filters, p, fixedQ)

  return (
    <div className="py-6 sm:py-8 products-grid-zone">

      {/* ── Barre mobile : bouton filtres + tri ── */}
      <div className="lg:hidden flex items-center gap-2 mb-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1.5">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            nbActifs > 0
              ? 'bg-[#F97316] text-white shadow-sm'
              : 'text-[#64748B] hover:bg-white hover:text-[#1E293B] hover:shadow-sm'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {nbActifs > 0 && (
            <span className="bg-white/25 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {nbActifs}
            </span>
          )}
        </button>
        <div className="w-px h-7 bg-[#E2E8F0] shrink-0" />
        <div className="flex-1 flex justify-center">
          <SortSelect value={filters.tri} onChange={(v) => handleFilterChange({ ...filters, tri: v })} />
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Sidebar filtres ── */}
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          availableBrands={availableBrands}
          hideBrand={hideBrand}
          hideCategorie={hideCategorie}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          nbActifs={nbActifs}
          totalResults={meta?.total_items ?? products.length}
        />

        {/* ── Overlay mobile (bottom sheet) ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Zone produits ── */}
        <div className="flex-1 min-w-0">

          {/* En-tête desktop : nb résultats + tri */}
          <div className="hidden lg:flex items-center justify-between mb-5">
            <div>
              {showQ ? (
                <h1 className="font-heading text-[#0F172A] text-xl font-bold">
                  {meta?.total_items != null
                    ? `${meta.total_items} résultat${meta.total_items > 1 ? 's' : ''}${showQ ? ` pour "${showQ}"` : ''}`
                    : `Résultats${showQ ? ` pour "${showQ}"` : ''}`}
                </h1>
              ) : (
                <p className="text-sm text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">{meta?.total_items ?? products.length}</span> produit(s)
                </p>
              )}
            </div>
            <SortSelect value={filters.tri} onChange={(v) => handleFilterChange({ ...filters, tri: v })} />
          </div>

          {/* Titre mobile avec nb résultats */}
          {showQ && (
            <div className="lg:hidden mb-4">
              <h1 className="font-heading text-[#0F172A] text-lg font-bold">
                {meta?.total_items != null
                  ? `${meta.total_items} résultat${meta.total_items > 1 ? 's' : ''}${showQ ? ` pour "${showQ}"` : ''}`
                  : `Résultats${showQ ? ` pour "${showQ}"` : ''}`}
              </h1>
            </div>
          )}

          {/* Badges filtres actifs */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.boutique && (
                <Badge
                  label={BOUTIQUES_LABEL[filters.boutique] ?? filters.boutique}
                  className={BOUTIQUES_BADGE[filters.boutique] ?? 'bg-slate-100 text-slate-700'}
                  onRemove={() => handleFilterChange({ ...filters, boutique: '' })}
                />
              )}
              {filters.categorie && (
                <Badge
                  label={PARENT_CATEGORIES.find(c => c.slug === filters.categorie)?.nom ?? filters.categorie}
                  className="bg-[#F97316]/10 text-[#F97316]"
                  onRemove={() => handleFilterChange({ ...filters, categorie: '' })}
                />
              )}
              {filters.marques.map(m => (
                <Badge
                  key={m}
                  label={m}
                  className="bg-[#F97316]/10 text-[#F97316]"
                  onRemove={() => handleFilterChange({ ...filters, marques: filters.marques.filter(x => x !== m) })}
                />
              ))}
              {(filters.prix_min || filters.prix_max) && (
                <Badge
                  label={
                    filters.prix_min && filters.prix_max
                      ? `${filters.prix_min} — ${filters.prix_max} TND`
                      : filters.prix_min ? `≥ ${filters.prix_min} TND` : `≤ ${filters.prix_max} TND`
                  }
                  className="bg-[#F97316]/10 text-[#F97316]"
                  onRemove={() => handleFilterChange({ ...filters, prix_min: '', prix_max: '' })}
                />
              )}
              {filters.en_promo && (
                <Badge
                  label="En promotion"
                  icon={<Tag size={10} />}
                  className="bg-[#F97316]/10 text-[#F97316]"
                  onRemove={() => handleFilterChange({ ...filters, en_promo: false })}
                />
              )}
              {filters.en_stock && (
                <Badge
                  label="En stock"
                  icon={<Package size={10} />}
                  className="bg-green-50 text-green-700"
                  onRemove={() => handleFilterChange({ ...filters, en_stock: false })}
                />
              )}
              {filters.tri && (
                <Badge
                  label={filters.tri === 'prix_asc' ? 'Prix ↑' : 'Prix ↓'}
                  icon={<ArrowUpDown size={10} />}
                  className="bg-[#F97316]/10 text-[#F97316]"
                  onRemove={() => handleFilterChange({ ...filters, tri: '' })}
                />
              )}
            </div>
          )}

          {/* Grille produits */}
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {products.flatMap((p, i) => {
                    const carte = <CarteProduit key={p.id} produit={p} />
                    const poser = adSlot && i === adApres - 1 && products.length > adApres
                    if (!poser) return [carte]
                    // Clé stable : sans elle, le bloc serait démonté puis remonté
                    // à chaque changement de filtre ou de page, et redemanderait
                    // une annonce à chaque fois.
                    return [carte, <AdSlot key="tp-liste-milieu" slot={adSlot} inGrid />]
                  })}
                </div>
                {meta && meta.total_pages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={meta.total_pages}
                    buildUrl={buildPageUrl}
                    onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  />
                )}
              </>
            ) : !loading && (
              <div className="text-center py-16 border border-dashed border-[#E2E8F0] rounded-2xl">
                <p className="text-[#64748B] text-sm">
                  {hasFilters ? 'Aucun résultat pour ces filtres. Essayez de les modifier.' : 'Aucun produit disponible.'}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ ...EMPTY_FILTERS })}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#F97316] font-semibold hover:underline"
                  >
                    <X size={13} /> Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={13} className="text-[#94A3B8] shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-[#1E293B] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F97316] bg-white cursor-pointer transition-colors appearance-none pr-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.25rem center',
          backgroundSize: '1.1em 1.1em',
        }}
      >
        <option value="">Pertinence</option>
        <option value="prix_asc">Prix ↑</option>
        <option value="prix_desc">Prix ↓</option>
      </select>
    </div>
  )
}

function Badge({
  label,
  icon,
  className,
  onRemove,
}: {
  label: string
  icon?: React.ReactNode
  className: string
  onRemove: () => void
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      {icon}
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity" aria-label={`Retirer ${label}`}>
        <X size={10} />
      </button>
    </span>
  )
}
