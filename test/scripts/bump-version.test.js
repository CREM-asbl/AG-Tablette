import { describe, it, expect } from 'vitest';
import { bumpPatch, bumpMinor, bumpMajor, bumpVersion, parseVersion, versionCodeFor } from '../../scripts/bump-version.mjs';

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

  it('incremente le minor', () => {
    expect(bumpMinor('1.5.2')).toBe('1.6.0');
    expect(bumpMinor('1.9.5')).toBe('1.10.0');
  });

  it('incremente le major', () => {
    expect(bumpMajor('1.5.2')).toBe('2.0.0');
    expect(bumpMajor('9.9.9')).toBe('10.0.0');
  });

  it('bumpVersion dispatch correctement', () => {
    expect(bumpVersion('1.5.2', 'patch')).toBe('1.5.3');
    expect(bumpVersion('1.5.2', 'minor')).toBe('1.6.0');
    expect(bumpVersion('1.5.2', 'major')).toBe('2.0.0');
    expect(bumpVersion('1.5.2')).toBe('1.5.3'); // default patch
  });

  it('calcule un versionCode monotone croissant', () => {
    expect(versionCodeFor('1.5.3', 151)).toBe(10503);
    expect(versionCodeFor('1.5.3', 10502)).toBe(10503);
    expect(versionCodeFor('1.5.3', 99999)).toBe(100000);
  });
});
