import { describe, expect, it, vi } from 'vitest';

vi.unmock('@services/site-slug-resolver');

import { KNOWN_OPEN_SLUGS } from '../../src/services/known-open-slugs';
import { parseSlug } from '../../src/services/site-slug-resolver';

describe('known open slugs (static prerender)', () => {
  it('liste non vide, normalisée, sans doublon', () => {
    expect(KNOWN_OPEN_SLUGS.length).toBeGreaterThan(0);
    for (const slug of KNOWN_OPEN_SLUGS) {
      expect(slug).toBe(slug.trim().toLowerCase());
    }
    expect(new Set(KNOWN_OPEN_SLUGS).size).toBe(KNOWN_OPEN_SLUGS.length);
  });

  it('contient le slug attendu assembler-des-figures', () => {
    expect(KNOWN_OPEN_SLUGS).toContain('assembler-des-figures');
  });

  it('fallback /open/ résout ?slug= côté client', () => {
    expect(parseSlug('/open/', '?slug=mon-activite')).toBe('mon-activite');
  });
});
