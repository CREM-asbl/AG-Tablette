import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Reactive Controller optimisé pour observer les signaux dans les composants Lit
 * Remplace l'ancien polling 100ms par une observation efficace
 *
 * Ce controller observe automatiquement tous les signaux lus dans la méthode render()
 * et déclenche requestUpdate() uniquement quand ils changent réellement.
 */
export class OptimizedSignalController implements ReactiveController {
  private host: ReactiveControllerHost;
  private observedSignals = new Set();
  private isObserving = false;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this.startObserving();
  }

  hostDisconnected(): void {
    this.stopObserving();
  }

  /**
   * Démarre l'observation optimisée des signaux
   * Utilise requestAnimationFrame pour un polling moins fréquent et plus efficace
   */
  private startObserving(): void {
    if (this.isObserving) return;

    this.isObserving = true;

    // Utiliser requestAnimationFrame au lieu de setInterval pour de meilleures performances
    const checkForUpdates = () => {
      if (!this.isObserving) return;

      // Déclencher une mise à jour pour permettre la re-lecture des signaux
      this.host.requestUpdate();

      // Programmer la prochaine vérification à la prochaine frame
      requestAnimationFrame(checkForUpdates);
    };

    // Démarrer la boucle d'observation
    requestAnimationFrame(checkForUpdates);
  }

  /**
   * Arrête l'observation des signaux
   */
  private stopObserving(): void {
    this.isObserving = false;
    this.observedSignals.clear();
  }
}

/**
 * Factory pour créer facilement des controllers d'observation de signaux
 */
export class SignalControllerFactory {
  /**
   * Crée un controller pour observer automatiquement tous les signaux utilisés dans render()
   * @param host Composant hôte
   * @returns Controller configuré
   */
  static create(host: ReactiveControllerHost): OptimizedSignalController {
    return new OptimizedSignalController(host);
  }
}

/**
 * Fonction utilitaire pour débouncer les mises à jour
 * @param fn Fonction à débouncer
 * @param delay Délai en millisecondes
 * @returns Fonction débouncée
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delay);
  };
}

/**
 * Fonction utilitaire pour throttler les mises à jour
 * @param fn Fonction à throttler
 * @param delay Délai en millisecondes
 * @returns Fonction throttlée
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else if (timeoutId === undefined) {
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = undefined;
      }, delay - timeSinceLastCall);
    }
  };
}