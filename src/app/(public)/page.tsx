import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Search, Zap, ArrowRight, CheckCircle2,
  TrendingUp, Tag, Smartphone, Home, Flame,
} from 'lucide-react'
import { getProduits } from '@/lib/api/produits'
import type { Produit } from '@/types'
import CarouselProduits from '@/components/ui/CarouselProduits'
import Image from 'next/image'
import MarqueeMarques from '@/components/ui/MarqueeMarques'
import CarouselCategories from '@/components/ui/CarouselCategories'
import CarouselEdito from '@/components/ui/CarouselEdito'
import { BannerHowItWorks } from '@/components/ui/Banners'
import BannerSlider from '@/components/ui/BannerSlider'
import CategoryScope from '@/components/ui/CategoryScope'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://toprix.tn'

export const metadata: Metadata = {
  title: 'Toprix.tn - Comparateur de Prix High-Tech Tunisie | Meilleurs Prix 2026',
  description: 'Comparez instantanément les prix de milliers de produits high-tech en Tunisie. Smartphones, PC, TV et électroménager chez Mytek, Tunisianet, Spacenet.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Toprix.tn - Comparateur de Prix High-Tech Tunisie',
    description: 'Trouvez les meilleures offres high-tech en Tunisie. Comparez les prix en temps réel chez Mytek, Tunisianet et Spacenet.',
    url: SITE_URL,
    type: 'website',
  },
}

const STATS = [
  { valeur: '50 000+', label: 'Produits' },
  { valeur: '120+',    label: 'Marques'  },
  { valeur: '3',       label: 'Boutiques'},
]


const AVANTAGES = [
  'Comparez les prix en temps réel',
  '3 boutiques référencées',
  'Trouvez le meilleur deal en secondes',
]

// Section titre réutilisable
function SectionHeader({
  eyebrow, title, icon: Icon, href, linkLabel,
}: {
  eyebrow: string
  title: string
  icon: React.FC<{ size?: number; className?: string }>
  href: string
  linkLabel: string
}) {
  return (
    <div className="flex items-end justify-between mb-6 sm:mb-8">
      <div>
        <p className="text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <Icon size={12} />
          {eyebrow}
        </p>
        <h2 className="font-heading text-[#0F172A] text-2xl md:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#F97316] sm:text-slate-500 hover:text-[#F97316] transition-colors shrink-0 ml-3"
      >
        <span className="hidden sm:inline">{linkLabel}</span>
        <span className="sm:hidden">Voir tout</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

export default async function AccueilPage() {
  // Chargement parallèle — 15 appels simultanés
  const [
    promosRes, smartphonesRes, electroRes, tvRes, laptopsRes, climaRes,
    chauffageRes, chauffeEauRes, chaudiereRes, radiateurRes,
    convecteurRes, secheLingeRes, chauffeBainRes, poeleRes, couvertureRes,
  ] = await Promise.allSettled([
    getProduits({ en_promo: true }),
    getProduits({ categorie: 'telephonie/smartphone' }),
    getProduits({ categorie: 'electromenager' }),
    getProduits({ categorie: 'tv-et-son/televiseur' }),
    getProduits({ categorie: 'informatique/ordinateur-portable' }),
    getProduits({ categorie: 'electromenager/climatisation' }),
    getProduits({ q: 'chauffage' }),
    getProduits({ q: 'chauffe-eau' }),
    getProduits({ q: 'chaudière' }),
    getProduits({ q: 'radiateur' }),
    getProduits({ q: 'convecteur' }),
    getProduits({ q: 'sèche-linge' }),
    getProduits({ q: 'chauffe-bain' }),
    getProduits({ q: 'poêle' }),
    getProduits({ q: 'couverture chauffante' }),
  ])

  const promos       = promosRes.status      === 'fulfilled' ? promosRes.value.data                    : []
  const smartphones  = smartphonesRes.status === 'fulfilled' ? smartphonesRes.value.data.slice(0, 20)  : []
  const electro      = electroRes.status     === 'fulfilled' ? electroRes.value.data.slice(0, 20)      : []
  const tvs          = tvRes.status          === 'fulfilled' ? tvRes.value.data.slice(0, 20)           : []
  const laptops      = laptopsRes.status     === 'fulfilled' ? laptopsRes.value.data.slice(0, 20)      : []
  const climatiseurs = climaRes.status       === 'fulfilled' ? climaRes.value.data.slice(0, 20)        : []
  const chauffages   = chauffageRes.status   === 'fulfilled' ? chauffageRes.value.data.slice(0, 6)    : []
  const chauffeEaux  = chauffeEauRes.status  === 'fulfilled' ? chauffeEauRes.value.data.slice(0, 6)    : []
  const chaudieres   = chaudiereRes.status   === 'fulfilled' ? chaudiereRes.value.data.slice(0, 6)     : []
  const radiateurs   = radiateurRes.status   === 'fulfilled' ? radiateurRes.value.data.slice(0, 6)     : []
  const convecteurs  = convecteurRes.status  === 'fulfilled' ? convecteurRes.value.data.slice(0, 6)    : []
  const sechesLinge  = secheLingeRes.status  === 'fulfilled' ? secheLingeRes.value.data.slice(0, 6)    : []
  const chauffeBains = chauffeBainRes.status === 'fulfilled' ? chauffeBainRes.value.data.slice(0, 6)   : []
  const poeles       = poeleRes.status       === 'fulfilled' ? poeleRes.value.data.slice(0, 6)         : []
  const couvertures  = couvertureRes.status  === 'fulfilled' ? couvertureRes.value.data.slice(0, 6)    : []

  // Tendances hiver — round-robin sur les familles de chauffage.
  // Aucune famille ne monopolise le carrousel, et une famille vide (terme sans
  // résultat dans le catalogue) ne laisse pas de trou : les autres comblent.
  const TENDANCES_MAX = 24
  const famillesHiver = [
    climatiseurs, chauffages, chauffeEaux, chaudieres, radiateurs,
    convecteurs, chauffeBains, sechesLinge, poeles, couvertures,
  ]
  const tendances: Produit[] = []
  const vus = new Set<string>()
  const profondeurMax = Math.max(...famillesHiver.map(f => f.length))
  for (let i = 0; i < profondeurMax && tendances.length < TENDANCES_MAX; i++) {
    for (const famille of famillesHiver) {
      if (tendances.length >= TENDANCES_MAX) break
      const p = famille[i]
      // Dédoublonnage : un même produit peut matcher plusieurs termes
      if (p && !vus.has(p.id)) {
        vus.add(p.id)
        tendances.push(p)
      }
    }
  }
  // Top promos = 8 premiers produits en promo
  const topPromos = promos.slice(0, 8)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Toprix',
    url: SITE_URL,
    description: 'Comparateur de prix high-tech en Tunisie : Mytek, Tunisianet, Spacenet.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/rechercher/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Toprix',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/web-app-manifest-512x512.png` },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="bg-white">

      {/* ─────────────────────────────────── HERO ───────────────────────────── */}
      <section className="relative bg-[#0F172A] min-h-[400px] overflow-hidden">

        {/* Grille décorative */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Halos orange */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#F97316] rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 bg-[#F97316] rounded-full blur-[100px] opacity-10 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 pt-10 sm:pt-12 pb-20 text-center">

          <div className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Zap size={11} />
            Comparateur n°1 en Tunisie
          </div>

          <h1 className="font-heading text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
            Comparez les produits<br />
            <span className="text-[#F97316]">high-tech au meilleur prix</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Smartphones, laptops, audio, gaming — comparez instantanément parmi toutes les boutiques en Tunisie.
          </p>

          <form
            action="/rechercher"
            method="get"
            className="flex items-center bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/40 max-w-2xl mx-auto mb-12"
          >
            <div className="flex items-center gap-3 flex-1 px-5">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                name="q"
                placeholder="Ex : iPhone 15, Galaxy S24, MacBook Air..."
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {AVANTAGES.map((a) => (
              <div key={a} className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 size={14} className="text-[#F97316] shrink-0" />
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-white/[0.03]">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-center gap-10 sm:gap-16">
            {STATS.map(({ valeur, label }) => (
              <div key={label} className="text-center">
                <p className="font-heading text-white text-xl font-bold">{valeur}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── CARROUSEL CATÉGORIES ────────────────────────────── */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <CarouselCategories />
        </div>
      </section>

      {/* ══════════════ BANNER CLAUDE PRO ════════════════════════════════════════ */}
      <section className="py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="relative w-full sm:w-1/2 group">
            {/* Badge sponsorisé */}
            <span className="absolute -top-2 right-4 z-10 bg-[#D4A574] text-[#1A1207] text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
              Sponsorisé
            </span>
            {/* Halo lumineux */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4A574]/20 via-[#F97316]/10 to-[#D4A574]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <a
              href="https://www.facebook.com/profile.php?id=61594263352905"
              target="_blank"
              rel="noopener noreferrer"
              className="relative block rounded-2xl overflow-hidden border border-[#D4A574]/20 group-hover:border-[#D4A574]/50 shadow-lg group-hover:shadow-xl group-hover:shadow-[#D4A574]/10 transition-all duration-300 group-hover:scale-[1.01]"
            >
              <Image
                src="/banners/TECHNOTECH-Claude-Official-banniere-1280x296.webp"
                alt="Claude Official en Tunisie — abonnement 90 DT/mois, paiement en dinars"
                width={1280}
                height={296}
                className="w-full h-auto"
                priority
              />
            </a>
          </div>
        </div>
      </section>

      {/* ═════════════════════ TENDANCE HIVER ═════════════════════════ */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Flame size={12} /> Tendance Hiver
              </p>
              <h2 className="font-heading text-2xl md:text-3xl" style={{ color: 'white' }}>Chauffage &amp; Fin d’année 2026</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

            <Link href="/rechercher?q=chauffage&tri=prix_asc"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C2D12] to-[#1E293B] p-6 border border-white/10 hover:border-[#FB923C]/50 transition-all">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10 select-none pointer-events-none">🔥</div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FB923C] to-transparent" />
              <span className="text-[#FDBA74] text-[11px] font-bold uppercase tracking-widest mb-3 block">Chauffage</span>
              <p className="font-heading text-xl font-bold mb-1" style={{ color: 'white' }}>Radiateurs &amp; convecteurs</p>
              <p className="text-slate-400 text-sm mb-5">Bain d’huile · Soufflant · Céramique</p>
              <span className="inline-flex items-center gap-1.5 text-[#FB923C] text-sm font-semibold group-hover:gap-3 transition-all">
                Voir les prix <ArrowRight size={13} />
              </span>
            </Link>

            <Link href="/rechercher?q=chauffe-eau&tri=prix_asc"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#78350F] to-[#1E293B] p-6 border border-white/10 hover:border-[#FBBF24]/50 transition-all">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10 select-none pointer-events-none">🚿</div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBBF24] to-transparent" />
              <span className="text-[#FDE68A] text-[11px] font-bold uppercase tracking-widest mb-3 block">Chauffe-eau</span>
              <p className="font-heading text-xl font-bold mb-1" style={{ color: 'white' }}>Chauffe-bain &amp; cumulus</p>
              <p className="text-slate-400 text-sm mb-5">Gaz · Électrique · Instantané</p>
              <span className="inline-flex items-center gap-1.5 text-[#FBBF24] text-sm font-semibold group-hover:gap-3 transition-all">
                Voir les prix <ArrowRight size={13} />
              </span>
            </Link>

            <Link href="/rechercher?q=chaudi%C3%A8re&tri=prix_asc"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7F1D1D] to-[#1E293B] p-6 border border-white/10 hover:border-[#F87171]/50 transition-all">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10 select-none pointer-events-none">♨️</div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F87171] to-transparent" />
              <span className="text-[#FCA5A5] text-[11px] font-bold uppercase tracking-widest mb-3 block">Chaudières</span>
              <p className="font-heading text-xl font-bold mb-1" style={{ color: 'white' }}>Gaz &amp; condensation</p>
              <p className="text-slate-400 text-sm mb-5">Murale · Mixte · Chauffage central</p>
              <span className="inline-flex items-center gap-1.5 text-[#F87171] text-sm font-semibold group-hover:gap-3 transition-all">
                Voir les prix <ArrowRight size={13} />
              </span>
            </Link>

            <Link href="/categories/electromenager/climatisation"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0C4A6E] to-[#1E293B] p-6 border border-white/10 hover:border-[#38BDF8]/50 transition-all">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10 select-none pointer-events-none">❄️</div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#38BDF8] to-transparent" />
              <span className="text-[#7DD3FC] text-[11px] font-bold uppercase tracking-widest mb-3 block">Climatiseurs</span>
              <p className="font-heading text-xl font-bold mb-1" style={{ color: 'white' }}>Réversible chaud &amp; froid</p>
              <p className="text-slate-400 text-sm mb-5">Inverter · 9 000 à 24 000 BTU</p>
              <span className="inline-flex items-center gap-1.5 text-[#38BDF8] text-sm font-semibold group-hover:gap-3 transition-all">
                Voir les prix <ArrowRight size={13} />
              </span>
            </Link>

            <Link href="/rechercher?en_promo=1&tri=prix_desc"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#9A3412] to-[#1E293B] p-6 border border-white/10 hover:border-[#F97316]/50 transition-all">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10 select-none pointer-events-none">🎁</div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F97316] to-transparent" />
              <span className="text-[#FDBA74] text-[11px] font-bold uppercase tracking-widest mb-3 block">Promos</span>
              <p className="font-heading text-xl font-bold mb-1" style={{ color: 'white' }}>Fin d’année 2026</p>
              <p className="text-slate-400 text-sm mb-5">Toutes les offres du moment</p>
              <span className="inline-flex items-center gap-1.5 text-[#F97316] text-sm font-semibold group-hover:gap-3 transition-all">
                Voir les prix <ArrowRight size={13} />
              </span>
            </Link>

          </div>
        </div>
      </section>

      {/* ───────────────────────── TENDANCES ACTUELLES ───────────────────────── */}
      {tendances.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              eyebrow="Produits de saison"
              title="Indispensables de l’hiver"
              icon={TrendingUp}
              href="/categories/electromenager/climatisation"
              linkLabel="Tout voir"
            />
            <CarouselProduits produits={tendances} />
          </div>
        </section>
      )}

      {/* ──────────────────────────── TOP PROMOS ─────────────────────────────── */}
      {topPromos.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-orange-50/70 to-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              eyebrow="Meilleures offres"
              title="Top promos"
              icon={Tag}
              href="/rechercher?en_promo=1"
              linkLabel="Voir toutes les promos"
            />
            <CarouselProduits produits={topPromos} />
          </div>
        </section>
      )}


      {/* ══════════════════════════ TÉLÉVISEURS ══════════════════════════════════ */}
      {tvs.length > 0 && (
        <section className="bg-[#0F172A] py-12 sm:py-16">

          {/* En-tête */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-[#F97316]" />
                  <span className="text-[#F97316] text-[10px] font-bold uppercase tracking-[0.2em]">Catégorie</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl" style={{ color: '#CBD5E1' }}>Téléviseurs</h2>
                <p className="text-sm" style={{ color: '#CBD5E1' }}>Smart TV · OLED · QLED · 4K</p>
              </div>

              {/* Image catégorie + CTA */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="relative w-28 h-20 rounded-xl overflow-hidden opacity-70">
                  <Image src="/banners/cat-moniteurs.webp" alt="TV" fill className="object-cover" sizes="112px" />
                </div>
                <Link
                  href="/categories/tv-et-son/televiseur?tri=prix_desc"
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-[#F97316] hover:text-[#F97316] text-white/70 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Séparateur */}
            <div className="mt-6 h-px bg-gradient-to-r from-[#F97316]/60 via-white/5 to-transparent" />
          </div>

          {/* Produits scroll */}
          <div className="px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <CarouselEdito produits={tvs} />
            </div>
          </div>

          {/* CTA mobile */}
          <div className="sm:hidden mt-6 px-4 flex justify-center">
            <Link
              href="/categories/tv-et-son/televiseur?tri=prix_desc"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Voir tous les téléviseurs <ArrowRight size={12} />
            </Link>
          </div>

        </section>
      )}

      {/* ────────────────────────── BANNER HOW IT WORKS ─────────────────────── */}
      <BannerHowItWorks />

      {/* ══════════════════════════ LAPTOPS ══════════════════════════════════════ */}
      {laptops.length > 0 && (
        <section className="bg-white py-12 sm:py-16 border-t-4 border-[#3B82F6]">

          {/* En-tête */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-[#3B82F6]" />
                  <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-[0.2em]">Catégorie</span>
                </div>
                <h2 className="font-heading text-[#0F172A] text-3xl sm:text-4xl">Laptops</h2>
                <p className="text-slate-400 text-sm">Ultrabooks · Gaming · Bureau · Créatifs</p>
              </div>

              {/* Image catégorie + CTA */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#E2E8F0]">
                  <Image src="/banners/cat-laptops.webp" alt="Laptops" fill className="object-cover" sizes="112px" />
                </div>
                <Link
                  href="/categories/informatique/ordinateur-portable"
                  className="inline-flex items-center gap-2 border border-[#3B82F6]/30 hover:border-[#3B82F6] hover:text-[#3B82F6] text-slate-500 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Séparateur */}
            <div className="mt-6 h-px bg-gradient-to-r from-[#3B82F6]/40 via-slate-100 to-transparent" />
          </div>

          {/* Produits scroll */}
          <div className="px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <CarouselEdito produits={laptops} />
            </div>
          </div>

          {/* CTA mobile */}
          <div className="sm:hidden mt-6 px-4 flex justify-center">
            <Link
              href="/categories/informatique/ordinateur-portable"
              className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Voir tous les laptops <ArrowRight size={12} />
            </Link>
          </div>

        </section>
      )}

      {/* ──────────────────────────── SMARTPHONES ────────────────────────────── */}
      {smartphones.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              eyebrow="Catégorie"
              title="Smartphones"
              icon={Smartphone}
              href="/categories/telephonie/smartphone?tri=prix_desc"
              linkLabel="Voir tous"
            />
            <CarouselProduits produits={smartphones} />
          </div>
        </section>
      )}

      {/* ──────────────── BANNER SLIDER (entre smartphones et électro) ──────── */}
      <section className="py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <BannerSlider />
        </div>
      </section>

      {/* ──────────────────────────── ÉLECTROMÉNAGER ─────────────────────────── */}
      {electro.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              eyebrow="Catégorie"
              title="Électroménager"
              icon={Home}
              href="/categories/electromenager"
              linkLabel="Voir tout"
            />
            <CarouselProduits produits={electro} />
          </div>
        </section>
      )}

      {/* ══════════════════════════ CLIMATISATION ═══════════════════════════════ */}
      {climatiseurs.length > 0 && (
        <section className="bg-[#EFF6FF] py-12 sm:py-16 border-t-4 border-[#38BDF8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-[#38BDF8]" />
                  <span className="text-[#0EA5E9] text-[10px] font-bold uppercase tracking-[0.2em]">Catégorie</span>
                </div>
                <h2 className="font-heading text-[#0F172A] text-3xl sm:text-4xl">Climatiseurs</h2>
                <p className="text-slate-500 text-sm">Split · Inverter · Monobloc · Multi-split</p>
              </div>
              <Link
                href="/categories/electromenager/climatisation"
                className="hidden sm:inline-flex items-center gap-2 border border-[#38BDF8]/50 hover:border-[#0EA5E9] hover:text-[#0EA5E9] text-slate-500 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="mt-6 h-px bg-gradient-to-r from-[#38BDF8]/50 via-blue-100 to-transparent" />
          </div>

          <div className="px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <CarouselEdito produits={climatiseurs} />
            </div>
          </div>

          <div className="sm:hidden mt-6 px-4 flex justify-center">
            <Link
              href="/categories/electromenager/climatisation"
              className="inline-flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Voir tous les climatiseurs <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      )}

      {/* ──────────────────────── CATEGORY SCOPE ─────────────────────────────── */}
      <CategoryScope />

      {/* ────────────────────────────── MARQUES ──────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-1">Référencées</p>
              <h2 className="font-heading text-[#0F172A] text-2xl md:text-3xl">
                Marques disponibles
              </h2>
            </div>
            <Link
              href="/marque"
              className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#F97316] sm:text-slate-500 hover:text-[#F97316] transition-colors shrink-0 ml-3"
            >
              <span className="hidden sm:inline">Voir toutes</span>
              <span className="sm:hidden">Voir tout</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        {/* Marquee auto-scroll — pause au survol */}
        <MarqueeMarques />
      </section>

      {/* ────────────────────────── CTA BOUTIQUE ─────────────────────────────── */}
      <section className="bg-[#0F172A] py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-white text-2xl md:text-3xl mb-3">
            Vous avez une boutique high-tech ?
          </h2>
          <p className="text-slate-400 mb-8">
            Référencez vos produits gratuitement et touchez des milliers d&apos;acheteurs.
          </p>
          <Link
            href="/ajouter"
            className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
          >
            Ajouter ma boutique <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
    </>
  )
}
