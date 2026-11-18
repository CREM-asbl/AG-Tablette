/**
 * Helpers pour la redirection des slugs /open inconnus.
 * Point d'entrée unique : App.parseURL (src/components/ag-app.ts).
 * Ce module ne résout rien, il centralise juste la notification persistée
 * (sessionStorage) et la redirection vers /index.html.
 */

export const OPEN_NOTICE_KEY = 'ag.openNotice';

export const UNKNOWN_LINK_MESSAGE = 'Lien inconnu — https://ag.crem.be';

export function isIndexPath(pathname: string): boolean {
  const path = String(pathname ?? '');
  return path === '/' || path === '/index.html' || path === '/index.html/';
}

export function shouldRedirectForUnknown(pathname: string): boolean {
  return !isIndexPath(pathname);
}

export function setPendingOpenNotice(message: string): void {
  try {
    window.sessionStorage.setItem(OPEN_NOTICE_KEY, message);
  } catch {
    // Stockage indisponible (navigation privée, etc.) : la redirection suffit.
  }
}

export function consumePendingOpenNotice(): string | null {
  try {
    const pending = window.sessionStorage.getItem(OPEN_NOTICE_KEY);
    if (pending) window.sessionStorage.removeItem(OPEN_NOTICE_KEY);
    return pending;
  } catch {
    return null;
  }
}

export function redirectToIndexWithNotice(message: string): void {
  if (isIndexPath(window.location.pathname)) return;
  setPendingOpenNotice(message);
  window.location.replace('/index.html');
}
