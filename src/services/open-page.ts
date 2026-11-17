/**
 * Logique cliente partagée des pages /open (route slug + fallback query).
 * Aucun throw : statut inconnu/illisible affiché dans la page.
 */
export async function runOpenPage(status: HTMLElement | null): Promise<void> {
  const { parseSlug, resolveBySiteSlug } = await import('./site-slug-resolver');
  const slug = parseSlug(window.location.pathname, window.location.search);
  if (!slug) {
    if (status) status.textContent = 'Lien inconnu';
    return;
  }
  try {
    const result = await resolveBySiteSlug(slug);
    if (!result) {
      if (status) status.textContent = 'Lien inconnu — https://ag.crem.be';
      return;
    }
    if (result.kind === 'file' && result.fileId) {
      const firebase = await import('@db/firebase-init');
      await firebase.openFileFromServer(result.fileId);
      if (status) status.textContent = 'Activité ouverte';
    } else if (result.kind === 'module') {
      const notions = await import('@store/notions');
      if (result.themeId) notions.toggleTheme(result.themeId);
      if (result.moduleId) notions.toggleModule(result.moduleId);
      if (status) status.textContent = 'Module ouvert';
    }
  } catch (error) {
    if (status)
      status.textContent = `Erreur: ${(error as Error)?.message ?? error}`;
  }
}
