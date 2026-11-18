import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@services/site-slug-resolver');

vi.mock('@utils/indexeddb-activities', () => ({
  getAllModules: vi.fn(() => Promise.resolve([])),
  getAllThemes: vi.fn(() => Promise.resolve([])),
}));

import { resolveBySiteSlug, parseSlug } from '../../src/services/site-slug-resolver';
import { cachedFiles, cachedModulesByTheme } from '@store/notions';
import * as firebaseInit from '@db/firebase-init';
import * as idb from '@utils/indexeddb-activities';

describe('site-slug-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(firebaseInit.findFileBySiteSlug).mockResolvedValue(null);
    vi.mocked(firebaseInit.findModuleBySiteSlug).mockResolvedValue(null);
    vi.mocked(firebaseInit.getFileDocFromFilename).mockResolvedValue(null);
    vi.mocked(firebaseInit.getModuleById).mockResolvedValue(null);

    vi.mocked(cachedModulesByTheme.get).mockReturnValue([]);
    vi.mocked(cachedFiles.get).mockReturnValue([]);

    vi.mocked(idb.getAllModules).mockResolvedValue([]);
    vi.mocked(idb.getAllThemes).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('résout un fichier par siteSlug', async () => {
    vi.mocked(firebaseInit.findFileBySiteSlug).mockResolvedValue({
      id: 'file-1',
      module: 'mod-1',
      theme: 'theme-1',
    });

    const result = await resolveBySiteSlug('mon-slug');

    expect(result).toEqual({
      kind: 'file',
      fileId: 'file-1',
      moduleId: 'mod-1',
      themeId: 'theme-1',
    });
    expect(firebaseInit.findFileBySiteSlug).toHaveBeenCalledWith('mon-slug');
  });

  it('résout un module par siteSlug', async () => {
    vi.mocked(firebaseInit.findModuleBySiteSlug).mockResolvedValue({
      id: 'mod-2',
      theme: { id: 'theme-2' },
    });

    const result = await resolveBySiteSlug('mod-slug');

    expect(result).toEqual({
      kind: 'module',
      moduleId: 'mod-2',
      themeId: 'theme-2',
    });
  });

  it('fallback ID exact fichier', async () => {
    vi.mocked(firebaseInit.getFileDocFromFilename).mockResolvedValue({
      id: 'exact-file',
      module: 'mod-x',
      theme: { id: 'theme-x' },
    });

    const result = await resolveBySiteSlug('exact-file');

    expect(result).toEqual({
      kind: 'file',
      fileId: 'exact-file',
      moduleId: 'mod-x',
      themeId: 'theme-x',
    });
  });

  it('fallback ID exact module', async () => {
    vi.mocked(firebaseInit.getModuleById).mockResolvedValue({
      id: 'exact-mod',
      theme: 'theme-y',
    });

    const result = await resolveBySiteSlug('exact-mod');

    expect(result).toEqual({
      kind: 'module',
      moduleId: 'exact-mod',
      themeId: 'theme-y',
    });
  });

  it('normalise trim et casse', async () => {
    vi.mocked(firebaseInit.findFileBySiteSlug).mockImplementation(async (slug) =>
      slug === 'mon-slug' ? { id: 'file-norm', module: 'm', theme: 't' } : null,
    );

    const result = await resolveBySiteSlug('  MON-SLUG  ');

    expect(result).toEqual({
      kind: 'file',
      fileId: 'file-norm',
      moduleId: 'm',
      themeId: 't',
    });
    expect(firebaseInit.findFileBySiteSlug).toHaveBeenCalledWith('mon-slug');
  });

  it('retourne null pour slug vide', async () => {
    const result = await resolveBySiteSlug('   ');

    expect(result).toBeNull();
    expect(firebaseInit.findFileBySiteSlug).not.toHaveBeenCalled();
  });

  it('retourne null pour slug inconnu', async () => {
    const result = await resolveBySiteSlug('inconnu');

    expect(result).toBeNull();
  });

  it('retourne null sans throw en offline', async () => {
    vi.mocked(firebaseInit.findFileBySiteSlug).mockImplementation(() => {
      throw new Error('offline');
    });
    vi.mocked(firebaseInit.findModuleBySiteSlug).mockImplementation(() => {
      throw new Error('offline');
    });
    vi.mocked(firebaseInit.getFileDocFromFilename).mockImplementation(() => {
      throw new Error('offline');
    });
    vi.mocked(firebaseInit.getModuleById).mockImplementation(() => {
      throw new Error('offline');
    });
    vi.mocked(idb.getAllModules).mockRejectedValue(new Error('offline'));
    vi.mocked(cachedModulesByTheme.get).mockImplementation(() => {
      throw new Error('offline');
    });
    vi.mocked(cachedFiles.get).mockImplementation(() => {
      throw new Error('offline');
    });

    await expect(resolveBySiteSlug('slug-offline')).resolves.toBeNull();
  });

  it('extrait le slug depuis le chemin ou la query', () => {
    expect(parseSlug('/open/Mon%20Slug', '')).toBe('Mon Slug');
    expect(parseSlug('/foo', '?slug=abc')).toBe('abc');
    expect(parseSlug('/open/abc', '?slug=def')).toBe('abc');
    expect(parseSlug('/', '')).toBeNull();
  });
});