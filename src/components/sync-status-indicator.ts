import { LitElement, css, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { isSyncInProgress } from '../services/activity-sync.js';

/**
 * Affiche uniquement l'état de synchronisation.
 * - Visible pendant une synchronisation (progress < 100)
 * - Reste visible 2s après la fin puis disparaît avec une animation fade/slide.
 */
@customElement('sync-status-indicator')
export class SyncStatusIndicator extends LitElement {
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

  @state() private percent = 100; // 100 = rien en cours
  @state() private visible = false; // contrôle rendu
  @state() private animatingIn = false;
  @property({ type: Number, attribute: 'hide-delay' }) hideDelay = 2000;
  private hideTimer: number | null = null;
  private pollTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('sync-progress', this.onProgress as EventListener);
    window.addEventListener('activities-synced', this.onSynced);
    // Poll de secours si aucun événement progress n'est émis régulièrement
    this.pollTimer = window.setInterval(() => {
      const active = isSyncInProgress();
      if (active && this.percent === 100) {
        // Force un état visible au début si on n'avait pas reçu l'event initial
        this.show();
        this.percent = 0; // valeur neutre; l'event mettra à jour ensuite
      }
    }, 1500);
  }

  disconnectedCallback() {
    window.removeEventListener('sync-progress', this.onProgress as EventListener);
    window.removeEventListener('activities-synced', this.onSynced);
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.clearHideTimer();
    super.disconnectedCallback();
  }

  private onProgress = (e: CustomEvent) => {
    const { percent } = e.detail;
    this.percent = percent;
    if (percent < 100) {
      this.show();
      this.clearHideTimer();
    } else {
      // Fin: laisser l'utilisateur voir 100% puis cacher après délai
      this.queueHide();
    }
  };

  private onSynced = () => {
    this.percent = 100;
    this.queueHide();
  };

  private show() {
    if (!this.visible) {
      this.visible = true;
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
      this.visible = false; // Déclenche l'animation via classe hide
      this.hideTimer = null;
      this.requestUpdate();
    }, this.hideDelay); // délai lecture configurable
  }

  private clearHideTimer() {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  render() {
    // On garde le noeud dans le DOM pour permettre l'animation de sortie.
    const hiding = !this.visible;
    const entering = this.animatingIn;
    return html`
      <div class="wrapper">
        <div class="indicator${hiding ? ' hide' : ''}${entering ? ' show' : ''}">
          <svg class="sync-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none" /><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/></svg>
          <span class="label">Synchronisation</span>
          <div class="progress-bar-bg"><div class="progress-bar" style="width:${Math.min(this.percent,100)}%"></div></div>
          <span style="font-size:12px;">${Math.min(this.percent,100)}%</span>
        </div>
      </div>
    `;
  }
}
