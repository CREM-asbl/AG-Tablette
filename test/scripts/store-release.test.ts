import { describe, expect, it } from 'vitest';

import {
  buildReleaseContext,
  getStageCommands,
  normalizeVersionInfo,
} from '../../scripts/store/release-lib.js';

describe('store release helpers', () => {
  it('normalise une version npm en versions stores', () => {
    const version = normalizeVersionInfo('1.5.2 beta');

    expect(version.raw).toBe('1.5.2 beta');
    expect(version.semver).toBe('1.5.2');
    expect(version.androidVersionCode).toBe(10502);
    expect(version.windowsVersion).toBe('1.5.2.0');
  });

  it('construit un contexte de release cohérent', () => {
    const context = buildReleaseContext({
      packageName: 'ag-tablette',
      packageVersion: '1.5.2 beta',
      track: 'beta',
      platform: 'all',
      buildNumber: 7,
      config: {
        app: {
          playPackageId: 'be.crem.ag.twa',
          windowsProductId: '9N7GCZKN4404',
        },
        release: {
          generatedDir: 'store/generated',
        },
        platforms: {
          android: {
            enabled: true,
            wrapperDir: 'store/android',
          },
          windows: {
            enabled: false,
            wrapperDir: 'store/windows',
          },
        },
      },
    });

    expect(context.release.track).toBe('beta');
    expect(context.version.androidVersionCode).toBe(10502);
    expect(context.version.windowsVersion).toBe('1.5.2.7');
    expect(context.platforms.android.enabled).toBe(true);
    expect(context.platforms.windows.enabled).toBe(false);
    expect(context.app.playPackageId).toBe('be.crem.ag.twa');
  });

  it('retient uniquement les commandes valides pour une étape', () => {
    const commands = getStageCommands({
      platform: 'all',
      stage: 'publish',
      config: {
        app: {},
        release: {},
        platforms: {
          android: {
            enabled: true,
            wrapperDir: 'store/android',
            publishCommand: './gradlew publishBundle',
          },
          windows: {
            enabled: true,
            wrapperDir: 'store/windows',
          },
        },
      },
    });

    expect(commands).toEqual([
      {
        platform: 'android',
        command: './gradlew publishBundle',
        cwd: 'store/android',
      },
    ]);
  });
});
