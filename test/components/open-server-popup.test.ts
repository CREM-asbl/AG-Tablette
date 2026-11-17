import { fixture, html } from '@open-wc/testing';
import { describe, expect, it } from 'vitest';
import '../../src/components/popups/open-server-popup';

describe('open-server-popup', () => {
  it('doit afficher le bouton principal et le focusser à l\'ouverture', async () => {
    const el = await fixture(html`<open-server-popup></open-server-popup>`);
    await (el as any).updateComplete;
    const button = el.shadowRoot?.querySelector('color-button');
    expect(button).toBeTruthy();
    // Le bouton doit être focus après ouverture
    await new Promise(resolve => setTimeout(resolve, 150));
    // Vérifier que focus() a été appelé plutôt que l'état du focus (plus fiable en test)
    expect((button as any)?.focus).toHaveBeenCalled();
  });

  it('ferme le popup sur Escape', async () => {
    const el = await fixture(html`<open-server-popup></open-server-popup>`);
    let closed = false;
    el.addEventListener('closed', () => closed = true);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(closed).toBeTruthy();
  });

  it('focus trap fonctionne (Tab)', async () => {
    const el = await fixture(html`<open-server-popup></open-server-popup>`);
    await (el as any).updateComplete;
    const focusables = (el as any).getFocusableElements();
    if (focusables.length > 1) {
      (focusables[focusables.length - 1] as HTMLElement).focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      el.shadowRoot?.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(document.activeElement === focusables[0]).toBeTruthy();
    }
  });
});
