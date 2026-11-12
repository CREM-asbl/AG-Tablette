import { signal } from '@lit-labs/signals';

/**
 * Types optionnels pour les métadonnées siteSlug (uniformisation AG mobile).
 */
export type Theme = { id?: string; title?: string; siteSlug?: string; [key: string]: unknown };
export type Module = { id?: string; title?: string; siteSlug?: string; theme?: string | { id?: string }; [key: string]: unknown };
export type File = { id?: string; title?: string; siteSlug?: string; module?: string; theme?: string; [key: string]: unknown };

// Signal pour le thème sélectionné
export const selectedTheme = signal(null);

// Signal pour stocker les thèmes en cache
export const cachedThemes = signal([]);

// Signal pour stocker les modules en cache par thème
export const cachedModulesByTheme = signal([]);

// Signal pour stocker les fichiers en cache
export const cachedFiles = signal([]);

// Fonction pour basculer la sélection d'un thème
export const toggleTheme = (themeName) => {
  if (selectedTheme.get() === themeName) {
    selectedTheme.set(null);
  } else {
    selectedTheme.set(themeName);
  }
};

export const selectedModule = signal('');

export const toggleModule = (moduleTitle) => {
  const current = selectedModule.get();

  if (current !== moduleTitle) {
    // Sélectionner le nouveau module
    selectedModule.set(moduleTitle);
  } else {
    // Si on clique sur l'élément déjà sélectionné, on le désélectionne
    selectedModule.set('');
  }
};

