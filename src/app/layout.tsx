import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import AdSenseScript from '@/components/ads/AdSenseScript'
import MessengerButton from '@/components/chat/MessengerButton'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
  display: 'swap',
})

const GTM_ID     = 'GTM-T7FNCLZT'
const GA4_ID     = 'G-5H9RJNSB6R'
const ADSENSE_ID = 'ca-pub-8451378376537532'

export const metadata: Metadata = {
  title: {
    default: 'Toprix - Comparateur de produits high-tech',
    template: '%s | Toprix',
  },
  description: 'Comparez les prix des smartphones, laptops et produits high-tech parmi toutes les boutiques en Tunisie.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://toprix.tn'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
  manifest: '/site.webmanifest',
  other: {
    'google-adsense-account': ADSENSE_ID,
    'Petal-Search-site-verification': '4434db8634',
  },

  openGraph: {
    type: 'website',
    locale: 'fr_TN',
    url: 'https://toprix.tn',
    siteName: 'Toprix',
    title: 'Toprix - Comparateur de produits high-tech',
    description: 'Comparez les prix des smartphones, laptops et produits high-tech parmi toutes les boutiques en Tunisie.',
    images: [{ url: '/web-app-manifest-512x512.png', width: 512, height: 512, alt: 'Toprix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toprix - Comparateur de produits high-tech',
    description: 'Comparez les prix des smartphones, laptops et produits high-tech parmi toutes les boutiques en Tunisie.',
    images: ['/web-app-manifest-512x512.png'],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Toprix',
  url: 'https://toprix.tn',
  logo: 'https://toprix.tn/web-app-manifest-512x512.png',
  description: 'Comparateur de prix high-tech en Tunisie. Comparez les prix sur Mytek, Tunisianet et Spacenet.',
  foundingDate: '2024',
  areaServed: { '@type': 'Country', name: 'Tunisia' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@toprix.tn',
    availableLanguage: ['French', 'Arabic'],
  },
  sameAs: [],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Toprix',
  url: 'https://toprix.tn',
  description: 'Comparateur de prix high-tech en Tunisie',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://toprix.tn/rechercher?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      {/* ── 0. JSON-LD Organization + WebSite ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* ── 1. Google Tag Manager ── dans <head>, le plus haut possible */}
      <Script id="gtm-head" strategy="beforeInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>

      {/* ── 2. Google tag (gtag.js) ── dans <head> */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="beforeInteractive"
      />
      <Script id="ga4-init" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA4_ID}');`}
      </Script>

      <body className="antialiased">
        {/* ── 3. GTM noscript ── juste après <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}

        {/* ── 4. Google AdSense ── désactivé sur /rechercher */}
        <AdSenseScript />

        {/* ── 5. Messenger ── remplace Tawk.to */}
        <MessengerButton />
      </body>
    </html>
  )
}
