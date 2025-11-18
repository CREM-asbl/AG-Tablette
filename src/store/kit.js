import { signal } from '@lit-labs/signals';

export const kit = signal();

export const getFamily = (name) => {
  const currentKit = kit.get();
  if (!currentKit || !currentKit.families) return undefined;
  return currentKit.families.find((family) => family.name === name);
};

const initTemplates = (families) => {
  families.shapeTemplates = families.shapeTemplates.map((template) => {
    return {
      name: 'Custom',
      fillColor: families.fillColor || '#aaa',
      fillOpacity: families.fillOpacity || 0.7,
      ...template,
    };
  });
};

export const loadKit = async (name) => {
  try {
    // Validation du nom de kit
    if (!name || typeof name !== 'string') {
      throw new Error('Nom de kit invalide');
    }

    const module = await import(`./kits/${name}.json`);

    if (!module.default) {
      throw new Error(`Kit "${name}" non trouvé ou invalide`);
    }

    const kitInitial = module.default;

    // Validation de la structure du kit
    if (!kitInitial.families || !Array.isArray(kitInitial.families)) {
      throw new Error(`Structure de kit invalide pour "${name}"`);
    }

    kitInitial.families.forEach((family) => {
      if (!family || typeof family !== 'object') {
        throw new Error(`Famille invalide dans le kit "${name}"`);
      }
      initTemplates(family);
    });

    kit.set(kitInitial);
    resetKitVisibility();
  } catch (error) {
    console.error('Erreur lors du chargement du kit:', error);
    // Notifier l'utilisateur de l'erreur
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: {
          message: `Erreur lors du chargement du kit: ${error.message}`,
        },
      }),
    );
    throw error; // Re-lancer pour permettre la gestion en amont
  }
};

export const resetKit = () => {
  kit.set(null);
};

export const resetKitVisibility = () => {
  const current = kit.get();
  if (!current || !current.families) return;
  current.families.forEach((family) => (family.isVisible = true));
  kit.set({ ...current });
};

export const setFamiliesVisibility = (families) => {
  const current = kit.get();
  current.families.forEach(
    (family) =>
    (family.isVisible = families.find(
      (f) => f.name === family.name,
    ).isVisible),
  );
  kit.set({ ...current });
};

export const toggleAllFamiliesVisibility = (visible) => {
  const current = kit.get();
  if (!current.families) return;
  current.families.forEach((family) => (family.isVisible = visible));
  kit.set({ ...current });
};

export const toggleFamilyVisibility = (familyName) => {
  const current = kit.get();
  const family = current.families.find((family) => family.name === familyName);
  family.isVisible = !family.isVisible;
  kit.set({ ...current });
};
