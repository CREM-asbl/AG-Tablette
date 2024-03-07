import { expect, fixture, html } from '@open-wc/testing';
import '../src/components/popups/help-popup.js';

describe('HelpPopup', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<help-popup></help-popup>`);
  });

  it('renders a h2', async () => {
    const h2 = element.shadowRoot.querySelector('h2');
    expect(h2).to.exist;
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
