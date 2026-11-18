import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@store/notions');

vi.mock('@db/firebase-init', () => ({
  openFileFromServer: vi.fn(() => Promise.resolve()),
  getModuleDocFromModuleName: vi.fn(() => ({})),
  getFilesDocFromModule: vi.fn(() =>
    Promise.resolve([{ id: 'f1', environment: 'Grandeurs' }]),
  ),
  findAllThemes: vi.fn(() => Promise.resolve([])),
  findAllFiles: vi.fn(() => Promise.resolve([])),
  downloadFileZip: vi.fn(() => Promise.resolve()),
  findFileBySiteSlug: vi.fn(() => Promise.resolve(null)),
  findModuleBySiteSlug: vi.fn(() => Promise.resolve(null)),
  getFileDocFromFilename: vi.fn(() => Promise.resolve(null)),
  getModuleById: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../src/controllers/Core/Environment.js', () => ({
  loadEnvironnement: vi.fn(() => Promise.resolve()),
}));

import { selectedModule, selectedTheme } from '../../src/store/notions';
import * as firebase from '@db/firebase-init';
import * as resolver from '@services/site-slug-resolver';

const loadEnv = async () => {
  const mod = await import('../../src/controllers/Core/Environment.js');
  return mod.loadEnvironnement as ReturnType<typeof vi.fn>;
};

describe('open double appel', () => {
  let messages: string[] = [];
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { message?: string } | undefined;
    if (detail?.message) messages.push(detail.message);
  };

  beforeEach(async () => {
    messages = [];
    window.addEventListener('show-notif', handler);
    vi.clearAllMocks();
    vi.mocked(resolver.parseSlug).mockReturnValue('mon-module');
    vi.mocked(resolver.resolveBySiteSlug).mockResolvedValue({
      kind: 'module',
      moduleId: 'mod-1',
      themeId: 'theme-1',
    });
    vi.mocked((firebase as any).getFilesDocFromModule).mockResolvedValue([
      { id: 'f1', environment: 'Grandeurs' },
    ]);
    vi.mocked((firebase as any).openFileFromServer).mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.removeEventListener('show-notif', handler);
  });

  it('double appel module garde la selection (pas de deselection toggle)', async () => {
    const { runOpenPage } = await import('../../src/services/open-page');
    await runOpenPage(null);
    await runOpenPage(null);

    expect(selectedTheme.get()).toBe('theme-1');
    expect(selectedModule.get()).toBe('mod-1');
    const loadEnvironnement = await loadEnv();
    expect(loadEnvironnement).toHaveBeenCalledWith('Grandeurs');
  });

  it('branche file appelle openFileFromServer une seule fois', async () => {
    vi.mocked(resolver.parseSlug).mockReturnValue('mon-activite');
    vi.mocked(resolver.resolveBySiteSlug).mockResolvedValue({
      kind: 'file',
      fileId: 'file-1',
      moduleId: 'mod-1',
      themeId: 'theme-1',
    });

    const { runOpenPage } = await import('../../src/services/open-page');
    await runOpenPage(null);

    expect((firebase as any).openFileFromServer).toHaveBeenCalledTimes(1);
    expect((firebase as any).openFileFromServer).toHaveBeenCalledWith('file-1');
  });

  it('branche file sans fileId notifie sans throw', async () => {
    vi.mocked(resolver.parseSlug).mockReturnValue('vide');
    vi.mocked(resolver.resolveBySiteSlug).mockResolvedValue({
      kind: 'file',
    } as any);

    const { runOpenPage } = await import('../../src/services/open-page');
    await expect(runOpenPage(null)).resolves.toBeUndefined();
    expect((firebase as any).openFileFromServer).not.toHaveBeenCalled();
    expect(messages).toContain('Lien inconnu — https://ag.crem.be');
  });
});
