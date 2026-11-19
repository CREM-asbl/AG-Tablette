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

/**
 * Construit l'URL d'entrée unique (index) correspondant à un chemin /open/*.
 * Centralise la conversion pour éviter la divergence dev/prod (page /open nue
 * vs rewrite hosting vers /index.html).
 */
export function openPathToIndexUrl(
  pathname: string,
  search: string = '',
): string {
  const params = new URLSearchParams(search ?? '');
  const parts = String(pathname ?? '').split('/').filter(Boolean);
  let slug: string | null = null;
  if (parts.length >= 2 && parts[0] === 'open') {
    try {
      slug = decodeURIComponent(parts[1]);
    } catch {
      slug = parts[1];
    }
  }
  const ordered: string[] = [];
  if (slug !== null) {
    ordered.push(`slug=${encodeURIComponent(slug)}`);
  }
  params.forEach((value, key) => {
    if (key === 'slug') return;
    ordered.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  const query = ordered.join('&');
  return query ? `/?${query}` : '/';
}
