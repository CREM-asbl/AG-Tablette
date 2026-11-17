import { describe, expect, it, vi } from 'vitest';

vi.unmock('@services/site-slug-resolver');

import { parseSlug } from '../../src/services/site-slug-resolver';

describe('open/:slug route extraction', () => {
  it('extrait le slug du chemin /open/:slug', () => {
    expect(parseSlug('/open/mon-activite', '')).toBe('mon-activite');
  });

  it('extrait le slug depuis ?slug=', () => {
    expect(parseSlug('/', '?slug=mon-activite')).toBe('mon-activite');
  });

  it('priorise le chemin sur la query', () => {
    expect(parseSlug('/open/chemin', '?slug=query')).toBe('chemin');
  });

  it('décode le slug', () => {
    expect(parseSlug('/open/a%20b', '')).toBe('a b');
  });

  it('retourne null sans slug', () => {
    expect(parseSlug('/', '')).toBeNull();
  });
});