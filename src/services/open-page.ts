/**
 * Logique cliente partagée des pages /open (route slug + fallback query).
 * @deprecated Plus appelé par les pages (point d'entrée unique : App.parseURL
 * dans src/components/ag-app.ts, protégé par window.__agOpenHandled).
 * Conservé pour compatibilité et tests. Aucun throw : statut
 * inconnu/illisible notifié via Toast (show-notif).
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
    if (result.kind === 'file') {
      if (!result.fileId) {
        notify('Lien inconnu — https://ag.crem.be');
        return;
      }
      const firebase = await import('@db/firebase-init');
      await firebase.openFileFromServer(result.fileId);
      notify('Activité ouverte');
    } else if (result.kind === 'module') {
      const notions = await import('@store/notions');
      if (result.themeId && notions.selectedTheme.get() !== result.themeId) {
        notions.selectedTheme.set(result.themeId);
      }
      if (result.moduleId && notions.selectedModule.get() !== result.moduleId) {
        notions.selectedModule.set(result.moduleId);
      }
      try {
        const firebase = await import('@db/firebase-init');
        if (result.moduleId) {
          const files = await firebase.getFilesDocFromModule(
            firebase.getModuleDocFromModuleName(result.moduleId),
          );
          const environment = (files as any[])?.find(
            (file: any) => file?.environment,
          )?.environment;
          if (environment) {
            const { loadEnvironnement } = await import(
              '../controllers/Core/Environment'
            );
            await loadEnvironnement(environment);
          } else {
            notify('Module ouvert — environnement introuvable');
            return;
          }
        }
      } catch (error) {
        notify(`Erreur: ${(error as Error)?.message ?? error}`);
        return;
      }
      notify('Module ouvert');
    }
  } catch (error) {
    notify(`Erreur: ${(error as Error)?.message ?? error}`);
  }
}
