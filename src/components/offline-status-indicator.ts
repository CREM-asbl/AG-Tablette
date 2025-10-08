
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { isSyncInProgress } from '../services/activity-sync.js';



@customElement('offline-status-indicator')
export class OfflineStatusIndicator extends LitElement {
  constructor() {
    super();
  }
  static styles = css`
    :host {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      font-family: system-ui, sans-serif;
      /* Style de débogage temporaire */
      border: 2px solid red;
    }
    .status-indicator {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      min-width: 120px; /* Assurer une largeur minimum */
    }
    .online { background-color: #4caf50; }
    .offline { background-color: #f44336; }
    .syncing { background-color: #ff9800; }
    .sync-icon {
      width: 16px;
      height: 16px;
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status-text { font-weight: 500; }
  `;

  @state() isOnline = navigator.onLine;
  @state() isSyncing = false;
  @state() lastSyncTime: string|null = null;
  @state() syncPercent: number = 100;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('activities-synced', this.handleSynced);
    window.addEventListener('sync-progress', this.handleSyncProgress as EventListener);
    this.syncPercent = 100;
    this.isSyncing = false;
    setInterval(() => {
      const wasInProgress = this.isSyncing;
      this.isSyncing = isSyncInProgress();
      if (wasInProgress !== this.isSyncing) {
        this.requestUpdate();
      }
    }, 1000);
  }

  disconnectedCallback() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('activities-synced', this.handleSynced);
    window.removeEventListener('sync-progress', this.handleSyncProgress as EventListener);
    super.disconnectedCallback();
  }

  handleOnline = () => { 
    this.isOnline = true; 
    this.requestUpdate();
  };
  handleOffline = () => { 
    this.isOnline = false; 
    this.requestUpdate();
  };
  handleSynced = () => {
    this.lastSyncTime = new Date().toLocaleTimeString();
    this.isSyncing = false;
    this.syncPercent = 100;
    this.requestUpdate();
  };
  handleSyncProgress = (e: CustomEvent) => {
    const { percent } = e.detail;
    this.syncPercent = percent;
    this.isSyncing = percent < 100;
    this.requestUpdate();
  };

  render() {
    let statusClass = 'online';
    let statusText = 'Connecté';
    let icon = html`<svg class="sync-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><path d="M12 6v6l4 2" stroke="white" stroke-width="2" fill="none"/></svg>`;
    if (!this.isOnline) {
      statusClass = 'offline';
      statusText = 'Hors ligne';
      icon = html`<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/><line x1="8" y1="8" x2="16" y2="16" stroke="#fff" stroke-width="2"/></svg>`;
    } else if (this.isSyncing) {
      statusClass = 'syncing';
      statusText = `Synchronisation... (${this.syncPercent}%)`;
      icon = html`<svg class="sync-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/></svg>`;
    }
    return html`
      <div class="status-indicator ${statusClass}">
        ${icon}
        <span class="status-text">${statusText}</span>
        ${this.lastSyncTime ? html`<span style="font-size: 12px;">Dernière sync: ${this.lastSyncTime}</span>` : ''}
      </div>
    `;
  }
}