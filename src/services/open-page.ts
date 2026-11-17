/**
 * Logique cliente partagée des pages /open (route slug + fallback query).
 * Aucun throw : statut inconnu/illisible notifié via Toast (show-notif).
 * Le paramètre `status` est conservé pour compatibilité mais ignoré
 * (plus d'injection textContent déformant le layout).
 */
export async function runOpenPage(status?: HTMLElement | null): Promise<void> {
  void status;
  const notify = (message: string) => {
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message } }));
  };

  const { parseSlug, resolveBySiteSlug } = await import('./site-slug-resolver');
  const slug = parseSlug(window.location.pathname, window.location.search);
  if (!slug) {
    notify('Lien inconnu');
    return;
  }
  try {
    const result = await resolveBySiteSlug(slug);
    if (!result) {
      notify('Lien inconnu — https://ag.crem.be');
      return;
    }
    if (result.kind === 'file' && result.fileId) {
      const firebase = await import('@db/firebase-init');
      await firebase.openFileFromServer(result.fileId);
      notify('Activité ouverte');
    } else if (result.kind === 'module') {
      const notions = await import('@store/notions');
      if (result.themeId) notions.toggleTheme(result.themeId);
      if (result.moduleId) notions.toggleModule(result.moduleId);
      notify('Module ouvert');
    }
  } catch (error) {
    notify(`Erreur: ${(error as Error)?.message ?? error}`);
  }
}
