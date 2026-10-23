import { describe, expect, it } from 'vitest';

describe('open-popup (issue #85)', () => {
  it('propose les Activités au lieu de "Ouvrir en ligne"', async () => {
    await import('../../../src/components/popups/open-popup.js');
    const el = document.createElement('open-popup');
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = [...el.shadowRoot.querySelectorAll('color-button')];
    const labels = buttons.map(
      (b) => b.getAttribute('innerText') || b.innerText,
    );
    expect(labels).toContain('Activités');
    expect(labels).not.toContain('Ouvrir en ligne');
    el.remove();
  });
});
