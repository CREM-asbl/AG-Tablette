import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { hideSyncIndicator, syncInProgress, syncProgress, syncVisible } from '../store/syncState.js';
import { OptimizedSignalController, debounce } from '../utils/signal-observer.js';

/**
 * Affiche uniquement l'état de synchronisation.
 * - Visible pendant une synchronisation (progress < 100)
 * - Reste visible 2s après la fin puis disparaît avec une animation fade/slide.
 *
 * Version optimisée qui remplace le polling 100ms par une observation efficace des signaux.
 */
@customElement('sync-status-indicator')
export class SyncStatusIndicator extends LitElement {
  // Utilisation du nouveau controller optimisé au lieu du polling
  private signalController = new OptimizedSignalController(this);

  static styles = css`
    :host { position: fixed; bottom: 10px; right: 10px; z-index: 1000; font-family: system-ui, sans-serif; }
    .wrapper { pointer-events: none; }
    .indicator {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      background-color: #ff9800;
      min-width: 160px;
      opacity: 1;
      transform: translateY(0);
      transition: opacity .4s ease, transform .4s ease;
    }
    .indicator.hide {
      opacity: 0;
      transform: translateY(8px);
    }
    .indicator.show {
      opacity: 0;
      transform: translateY(16px);
      animation: fadeInIndicator .4s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes fadeInIndicator {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .progress-bar-bg { width: 80px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.3); overflow: hidden; }
    .progress-bar { height: 100%; background: #fff; width: 0%; transition: width .3s ease; }
    .sync-icon { width: 16px; height: 16px; animation: spin 1.4s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
    .label { font-weight: 500; }
  `;

  @state() private animatingIn = false;
  @state() private lastProgress = 0;
  @state() private lastVisible = false;
  @state() private lastInProgress = false;
  @property({ type: Number, attribute: 'hide-delay' }) hideDelay = 2000;
  private hideTimer: number | null = null;

  // Version débouncée de requestUpdate pour éviter les mises à jour trop fréquentes
  private debouncedUpdate = debounce(() => {
    this.requestUpdate();
  }, 50);

  connectedCallback() {
    super.connectedCallback();

    // Écouter les événements personnalisés du store pour réagir aux changements
    window.addEventListener('sync-progress-changed', this.handleSyncProgressChange);
    window.addEventListener('sync-completed', this.handleSyncCompleted);
    window.addEventListener('sync-indicator-hidden', this.handleIndicatorHidden);
  }

  disconnectedCallback() {
    this.clearHideTimer();

    // Nettoyer les événements
    window.removeEventListener('sync-progress-changed', this.handleSyncProgressChange);
    window.removeEventListener('sync-completed', this.handleSyncCompleted);
    window.removeEventListener('sync-indicator-hidden', this.handleIndicatorHidden);

    super.disconnectedCallback();
  }

  private handleSyncProgressChange = (event: CustomEvent) => {
    const { percent, inProgress } = event.detail;

    // Détecter le début de synchronisation
    if (inProgress && !this.lastInProgress) {
      this.show();
      this.clearHideTimer();
    }

    this.lastInProgress = inProgress;
    this.lastProgress = percent;
    this.debouncedUpdate();
  };

  private handleSyncCompleted = (event: CustomEvent) => {
    const { hideIndicator } = event.detail;

    if (hideIndicator) {
      hideSyncIndicator(true);
    } else {
      this.queueHide();
    }

    this.debouncedUpdate();
  };

  private handleIndicatorHidden = () => {
    this.clearHideTimer();
    this.lastVisible = false;
    this.debouncedUpdate();
  };

  updated(changedProperties) {
    super.updated(changedProperties);

    // Lire les signaux pour déclencher l'observation
    const currentInProgress = syncInProgress.value ?? false;
    const currentProgress = syncProgress.value ?? 100;
    const currentVisible = syncVisible.value ?? false;

    // Détecter le début de synchronisation
    if (currentInProgress && !this.lastInProgress) {
      this.show();
      this.clearHideTimer();
    }

    // Détecter la fin de synchronisation
    if (!currentInProgress && this.lastInProgress && currentProgress === 100) {
      this.queueHide();
    }

    // Mettre à jour les dernières valeurs
    this.lastInProgress = currentInProgress;
    this.lastProgress = currentProgress;
    this.lastVisible = currentVisible;
  }

  private show() {
    if (!syncVisible.value) {
      syncVisible.value = true;
      this.animatingIn = true;
      setTimeout(() => {
        this.animatingIn = false;
        this.requestUpdate();
      }, 400); // durée de l'animation d'entrée
    }
  }

  private queueHide() {
    this.clearHideTimer();
    this.hideTimer = window.setTimeout(() => {
      hideSyncIndicator(); // Utilise la fonction du store
      this.hideTimer = null;
      this.requestUpdate();
    }, this.hideDelay); // délai configurable
  }

  private clearHideTimer() {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  render() {
    // Lire les signaux - le controller optimisé déclenchera requestUpdate() quand ils changent
    const visible = syncVisible.value ?? false;
    const percent = syncProgress.value ?? 100;
    const inProgress = syncInProgress.value ?? false;

    const hiding = !visible;
    const entering = this.animatingIn;

    // Log pour debug uniquement en développement
    if ((inProgress || visible) && (window.location.hostname === 'localhost' || window.location.search.includes('debug=true'))) {
      console.log('[SYNC-RENDER] percent:', percent, 'visible:', visible, 'inProgress:', inProgress);
    }

    // Afficher l'indicateur si visible, en cours ou en animation
    const shouldShow = visible || inProgress || entering;

    if (!shouldShow) {
      return html``;
    }

    return html`
      <div class="wrapper">
        <div class="indicator${hiding ? ' hide' : ''}${entering ? ' show' : ''}" style="background-color: ${percent < 100 ? '#ff9800' : '#4caf50'};">
          <svg class="sync-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none" /><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/></svg>
          <span class="label">Synchronisation ${percent}%</span>
          <div class="progress-bar-bg"><div class="progress-bar" style="width:${Math.min(percent, 100)}%"></div></div>
        </div>
      </div>
    `;
  }
}
