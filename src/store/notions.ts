import { signal } from '@lit-labs/signals';

// Signal pour le thème sélectionné
export const selectedNotion = signal(null);

// Signal pour stocker les thèmes en cache
export const cachedThemes = signal([]);

// Signal pour stocker les séquences en cache
export const cachedSequences = signal([]);

// Signal pour stocker les fichiers en cache
export const cachedFiles = signal([]);

// Fonction pour basculer la sélection d'un thème
export const toggleNotion = (notionName) => {
  if (selectedNotion.get() === notionName) {
    selectedNotion.set(null);
  } else {
    selectedNotion.set(notionName);
  }
};

export const selectedSequence = signal('');

export const toggleSequence = (sequenceTitle: string) => {
  const current = selectedSequence.get();

  if (current !== sequenceTitle) {
    // Sélectionner la nouvelle séquence
    selectedSequence.set(sequenceTitle);
  } else {
    // Si on clique sur l'élément déjà sélectionné, on le désélectionne
    selectedSequence.set('');
  }
}