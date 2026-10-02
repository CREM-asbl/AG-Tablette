import { describe, it, expect } from 'vitest';
import { bumpPatch, parseVersion, versionCodeFor } from '../../scripts/bump-version.mjs';

describe('bump-version', () => {
  it('parse la version semver', () => {
    expect(parseVersion('1.5.2')).toEqual({ major: 1, minor: 5, patch: 2 });
  });

  it('rejette une version invalide', () => {
    expect(() => parseVersion('1.5')).toThrow();
    expect(() => parseVersion('abc')).toThrow();
  });

  it('incremente le patch', () => {
    expect(bumpPatch('1.5.2')).toBe('1.5.3');
    expect(bumpPatch('1.5.9')).toBe('1.5.10');
  });

  it('calcule un versionCode monotone croissant', () => {
    expect(versionCodeFor('1.5.3', 151)).toBe(10503);
    expect(versionCodeFor('1.5.3', 10502)).toBe(10503);
    expect(versionCodeFor('1.5.3', 99999)).toBe(100000);
  });
});
