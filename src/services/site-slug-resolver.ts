import { cachedFiles, cachedModulesByTheme, cachedThemes } from '@store/notions';
import { getAllModules, getAllThemes } from '@utils/indexeddb-activities';

export function parseSlug(pathname: string, search: string): string | null {
  const parts = String(pathname ?? '').split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'open') {
    try {
      return decodeURIComponent(parts[1]);
    } catch {
      return parts[1];
    }
  }
  const params = new URLSearchParams(search ?? '');
  const querySlug = params.get('slug');
  return querySlug;
}

export type SiteSlugResolution =
  | {
      kind: 'file';
      fileId?: string;
      moduleId?: string;
      themeId?: string;
    }
  | {
      kind: 'module';
      moduleId?: string;
      themeId?: string;
    };

function normalizeSlug(slug: string): string {
  return String(slug ?? '').trim().toLowerCase();
}

function extractThemeId(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

export async function resolveBySiteSlug(
  slug: string,
): Promise<SiteSlugResolution | null> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;

  // 1. Firestore (online / cache persistant)
  try {
    const firebase = await import('@db/firebase-init');
    const findFileBySiteSlug = (firebase as any).findFileBySiteSlug;
    if (typeof findFileBySiteSlug === 'function') {
      const file = await Promise.resolve(findFileBySiteSlug(normalized)).catch(
        () => null,
      );
      if (file && file.id) {
        return {
          kind: 'file',
          fileId: file.id,
          moduleId: file.module ?? file.moduleId,
          themeId: extractThemeId(file.theme ?? file.themeId),
        };
      }
    }

    const findModuleBySiteSlug = (firebase as any).findModuleBySiteSlug;
    if (typeof findModuleBySiteSlug === 'function') {
      const mod = await Promise.resolve(
        findModuleBySiteSlug(normalized),
      ).catch(() => null);
      if (mod && mod.id) {
        return {
          kind: 'module',
          moduleId: mod.id,
          themeId: extractThemeId(mod.theme ?? mod.themeId),
        };
      }
    }

    // Fallback getDoc exact ID (file puis module)
    const getFileDocFromFilename = (firebase as any).getFileDocFromFilename;
    if (typeof getFileDocFromFilename === 'function') {
      const fileDoc = await Promise.resolve(
        getFileDocFromFilename(normalized),
      ).catch(() => null);
      if (fileDoc && fileDoc.id) {
        return {
          kind: 'file',
          fileId: fileDoc.id,
          moduleId: fileDoc.module ?? fileDoc.moduleId,
          themeId: extractThemeId(fileDoc.theme ?? fileDoc.themeId),
        };
      }
    }

    const getModuleById = (firebase as any).getModuleById;
    if (typeof getModuleById === 'function') {
      const modDoc = await Promise.resolve(getModuleById(normalized)).catch(
        () => null,
      );
      if (modDoc && modDoc.id) {
        return {
          kind: 'module',
          moduleId: modDoc.id,
          themeId: extractThemeId(modDoc.theme ?? modDoc.themeId),
        };
      }
    }
  } catch {
    // ignore - offline fallback ci-dessous
  }

  // 2. Cache mémoire
  try {
    const modulesByTheme = cachedModulesByTheme.get?.() ?? [];
    for (const sequence of modulesByTheme) {
      const modules = sequence?.modules ?? [];
      for (const module of modules) {
        const moduleSlug =
          typeof module?.siteSlug === 'string'
            ? module.siteSlug.trim().toLowerCase()
            : undefined;
        if (
          module?.id === normalized ||
          moduleSlug === normalized
        ) {
          return {
            kind: 'module',
            moduleId: module.id,
            themeId: sequence?.theme,
          };
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    const themes = cachedThemes.get?.() ?? [];
    for (const theme of themes) {
      if (theme?.id === normalized || theme?.siteSlug === normalized) {
        // Un thème seul ne correspond pas à un kind file/module.
      }
    }
  } catch {
    // ignore
  }

  // 3. IndexedDB
  try {
    const modules = await getAllModules();
    for (const entry of modules ?? []) {
      const data = entry?.data ?? entry;
      const id = entry?.id ?? data?.id;
      const rawSlug = data?.siteSlug ?? entry?.siteSlug;
      const siteSlug =
        typeof rawSlug === 'string' ? rawSlug.trim().toLowerCase() : undefined;
      if (id === normalized || siteSlug === normalized) {
        return {
          kind: 'module',
          moduleId: id,
          themeId: extractThemeId(data?.theme ?? entry?.theme),
        };
      }
    }
  } catch {
    // ignore
  }

  try {
    await getAllThemes();
  } catch {
    // ignore
  }

  // 4. Cache fichiers mémoire (best-effort)
  try {
    const cachedFilesValue = cachedFiles.get?.() ?? [];
    const groups = Array.isArray(cachedFilesValue)
      ? cachedFilesValue
      : [cachedFilesValue];
    for (const group of groups) {
      const files = Array.isArray(group?.files)
        ? group.files
        : Array.isArray(group)
        ? group
        : [];
      for (const file of files) {
        const fileSlug =
          typeof file?.siteSlug === 'string'
            ? file.siteSlug.trim().toLowerCase()
            : undefined;
        if (file?.id === normalized || fileSlug === normalized) {
          return {
            kind: 'file',
            fileId: file.id,
            moduleId: file.module ?? file.moduleId,
            themeId: extractThemeId(file.theme ?? file.themeId),
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}