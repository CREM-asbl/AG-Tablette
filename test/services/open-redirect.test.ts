import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumePendingOpenNotice,
  isIndexPath,
  OPEN_NOTICE_KEY,
  redirectToIndexWithNotice,
  setPendingOpenNotice,
  shouldRedirectForUnknown,
} from '../../src/services/open-redirect';

describe('open-redirect', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('index paths ne redirigent pas', () => {
    expect(isIndexPath('/')).toBe(true);
    expect(isIndexPath('/index.html')).toBe(true);
    expect(shouldRedirectForUnknown('/')).toBe(false);
    expect(shouldRedirectForUnknown('/index.html')).toBe(false);
  });

  it('slug inconnu redirige vers /index.html', () => {
    expect(shouldRedirectForUnknown('/open/slug-inconnu')).toBe(true);
    expect(shouldRedirectForUnknown('/404.html')).toBe(true);
  });

  it('persiste puis consomme la notice une seule fois', () => {
    setPendingOpenNotice('Lien inconnu');
    expect(window.sessionStorage.getItem(OPEN_NOTICE_KEY)).toBe('Lien inconnu');
    expect(consumePendingOpenNotice()).toBe('Lien inconnu');
    expect(consumePendingOpenNotice()).toBeNull();
  });

  it('redirectToIndexWithNotice stocke puis replace vers /index.html', () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/open/slug-inconnu', replace },
      writable: true,
    });
    redirectToIndexWithNotice('Lien inconnu');
    expect(window.sessionStorage.getItem(OPEN_NOTICE_KEY)).toBe('Lien inconnu');
    expect(replace).toHaveBeenCalledWith('/index.html');
  });

  it('ne redirige pas depuis index', () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/index.html', replace },
      writable: true,
    });
    redirectToIndexWithNotice('Lien inconnu');
    expect(replace).not.toHaveBeenCalled();
  });
});
