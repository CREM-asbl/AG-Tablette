import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/color-button', () => ({}));
vi.mock('@components/popups/template-popup', () => ({}));
vi.mock('@styles/popup-variables.css', () => ({}));

beforeEach(async () => {
  vi.resetModules();
  if (!customElements.get('level-popup')) {
    await import('../../../src/controllers/Tangram/level-popup.js');
  }
});

describe('level-popup', () => {
  it('préselectionne le niveau fourni', async () => {
    const popup = document.createElement('level-popup');
    popup.level = 4;
    document.body.appendChild(popup);
    await popup.updateComplete;

    const checked = popup.shadowRoot.querySelector('input[name="level"]:checked');

    expect(checked).not.toBeNull();
    expect(checked.value).toBe('4');
    popup.remove();
  });

  it('dispatche select avec le niveau choisi', () => {
    const popup = document.createElement('level-popup');
    popup.level = 5;
    const listener = vi.fn();
    popup.addEventListener('select', listener);

    popup.submit();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toBe(5);
  });

  it('retire l écouteur global close-popup au disconnect', async () => {
    const popup = document.createElement('level-popup');
    document.body.appendChild(popup);
    await popup.updateComplete;
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    popup.remove();

    expect(removeSpy).toHaveBeenCalledWith('close-popup', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('ne soumet plus après disconnect', async () => {
    const popup = document.createElement('level-popup');
    document.body.appendChild(popup);
    await popup.updateComplete;
    const listener = vi.fn();
    popup.addEventListener('select', listener);

    popup.remove();
    window.dispatchEvent(new CustomEvent('close-popup'));

    expect(listener).not.toHaveBeenCalled();
  });
});
