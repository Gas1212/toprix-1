// Configuration AdSense — blocs manuels.
//
// Les Auto Ads sont exclues de /marque et /categories côté console AdSense :
// Google y injectait un <div class="google-auto-placed"> comme enfant direct de
// la rangée flex « filtres + grille », où il devenait un 3e flex item et
// écrasait la colonne produits (flex-1 min-w-0).
//
// Règle de pose : un seul bloc par page, jamais accolé à un bouton
// « Voir l'offre » ou « Comparer ».

export const ADSENSE_CLIENT = 'ca-pub-8451378376537532'

export const AD_SLOTS = {
  /**
   * tp-accueil-milieu — accueil, entre la sélection de saison et le carrousel
   * Tendances. ACTIF. Hors plan de pose initial.
   *
   * L'accueil n'est pas exclu des Auto Ads : ce bloc s'y ajoute au lieu de les
   * remplacer, la page porte donc plus d'une annonce.
   */
  accueilMilieu: '7576620492',

  /**
   * tp-produit-bas — fiche /produit/[slug], sous le tableau comparatif des
   * offres et au-dessus des produits similaires. ACTIF.
   */
  produitBas: '5015720549',

  /**
   * tp-liste-milieu — pages /marque et /categories, dans la grille produits
   * après le 8e à 12e article, sur toute la largeur (tp-ad--grid).
   * PAS ENCORE POSÉ : prévu à partir du 30/10/2026, sur feu vert explicite.
   */
  listeMilieu: '7215130596',

  /**
   * tp-recherche-milieu — /rechercher, après le 5e résultat, pleine largeur.
   * PAS ENCORE POSÉ : facultatif, à partir du 17/11/2026.
   * Nécessitera de retirer '/rechercher' de PAGES_SANS_ADS dans
   * AdSenseScript.tsx, sans quoi le chargeur adsbygoogle.js n'y est pas servi.
   */
  rechercheMilieu: '6369164810',
} as const
