/**
 * Slugs connus pré-rendus à la compilation pour la route statique /open/:slug.
 *
 * En `output: 'static'`, Astro ne génère qu'un HTML par entrée de
 * `getStaticPaths()`. Tout slug absent de cette liste 404 en preview statique.
 * Ajouter ici tout nouveau slug site à pré-rendre (un rebuild suffit).
 * Les slugs non listés restent résolus côté client via `?slug=` sur /open/.
 */
export const KNOWN_OPEN_SLUGS: string[] = [
  'assembler-des-figures',
  'mon-activite',
  'mon-module',
];
