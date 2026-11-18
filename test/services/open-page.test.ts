import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('runOpenPage', () => {
  let handler: ((e: Event) => void) | null = null;
  let messages: string[] = [];

  beforeEach(() => {
    messages = [];
    handler = (_e: Event) => {
      const detail = (_e as CustomEvent).detail as { message?: string } | undefined;
      if (detail?.message) messages.push(detail.message);
    };
    window.addEventListener('show-notif', handler);
  });

  afterEach(() => {
    if (handler) window.removeEventListener('show-notif', handler);
    handler = null;
    vi.clearAllMocks();
  });

  it('slug absent déclenche show-notif et n’injecte aucun textContent', async () => {
    // Le mock global de site-slug-resolver renvoie parseSlug => null.
    const status = document.createElement('div');
    status.textContent = 'Chargement…';

    const { runOpenPage } = await import('../../src/services/open-page');
    await runOpenPage(status);

    expect(messages).toContain('Lien inconnu');
    expect(status.textContent).toBe('Chargement…');
  });
});