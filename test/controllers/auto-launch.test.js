import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  pendingFile: undefined,
  setCalls: [],
};

vi.mock('@store/appState', () => ({
  fileToOpen: {
    get: vi.fn(() => state.pendingFile),
  },
  appActions: {
    setFileToOpen: vi.fn((file) => {
      state.setCalls.push(file);
      state.pendingFile = file;
    }),
  },
}));

vi.mock('@controllers/Core/Environment', () => ({
  loadEnvironnement: vi.fn(() => Promise.resolve()),
}));

vi.mock('@controllers/Core/Managers/OpenFileManager', () => ({
  OpenFileManager: {
    newReadFile: vi.fn(() => Promise.resolve()),
  },
}));

const launchQueueStub = { setConsumer: vi.fn() };

describe('auto-launch', () => {
  beforeEach(() => {
    vi.resetModules();
    state.pendingFile = undefined;
    state.setCalls = [];
    vi.clearAllMocks();
    // @ts-ignore jsdom n'expose pas launchQueue
    window.launchQueue = launchQueueStub;
    launchQueueStub.setConsumer.mockClear();
  });

  it("mappe chaque extension vers son environnement (insensible à la casse)", async () => {
    const { getEnvironmentForFile } = await import(
      '@controllers/auto-launch'
    );
    expect(getEnvironmentForFile('cours.agg')).toBe('Grandeurs');
    expect(getEnvironmentForFile('jeu.AGT')).toBe('Tangram');
    expect(getEnvironmentForFile('silhouette.ags')).toBe('Tangram');
    expect(getEnvironmentForFile('cube.agc')).toBe('Cubes');
    expect(getEnvironmentForFile('figure.AGL')).toBe('Geometrie');
    expect(getEnvironmentForFile('notes.txt')).toBeUndefined();
    expect(getEnvironmentForFile('sans-extension')).toBeUndefined();
    expect(getEnvironmentForFile('__proto__')).toBeUndefined();
  });

  it('charge le bon environnement puis ouvre le fichier launché', async () => {
    await import('@controllers/auto-launch');
    const consumer = launchQueueStub.setConsumer.mock.calls[0][0];
    const { loadEnvironnement } = await import('@controllers/Core/Environment');
    const { OpenFileManager } = await import(
      '@controllers/Core/Managers/OpenFileManager'
    );
    const { appActions } = await import('@store/appState');

    const fileHandle = { name: 'figure.agl', getFile: vi.fn() };
    await consumer({ files: [fileHandle] });

    expect(loadEnvironnement).toHaveBeenCalledWith('Geometrie');
    expect(appActions.setFileToOpen).toHaveBeenCalledWith(fileHandle);
    expect(OpenFileManager.newReadFile).toHaveBeenCalledWith(fileHandle);
    expect(appActions.setFileToOpen).toHaveBeenLastCalledWith(null);
  });

  it('ignore les extensions inconnues', async () => {
    await import('@controllers/auto-launch');
    const consumer = launchQueueStub.setConsumer.mock.calls[0][0];
    const { loadEnvironnement } = await import('@controllers/Core/Environment');
    const { OpenFileManager } = await import(
      '@controllers/Core/Managers/OpenFileManager'
    );

    await consumer({ files: [{ name: 'notes.txt' }] });

    expect(loadEnvironnement).not.toHaveBeenCalled();
    expect(OpenFileManager.newReadFile).not.toHaveBeenCalled();
  });

  it("n'ouvre pas deux fois si ag-main a déjà consommé le fichier", async () => {
    await import('@controllers/auto-launch');
    const consumer = launchQueueStub.setConsumer.mock.calls[0][0];
    const { OpenFileManager } = await import(
      '@controllers/Core/Managers/OpenFileManager'
    );
    const { fileToOpen } = await import('@store/appState');

    // Garde défensive : simule un futur lecteur concurrent du signal
    // (ex. ag-main réactif). Aujourd'hui le claim synchrone rend ce cas
    // inatteignable en prod, mais la garde doit rester protectrice.
    fileToOpen.get.mockReturnValueOnce(null);

    await consumer({ files: [{ name: 'figure.agl' }] });

    expect(OpenFileManager.newReadFile).not.toHaveBeenCalled();
  });

  it('continue avec les fichiers suivants si un environnement échoue', async () => {
    await import('@controllers/auto-launch');
    const consumer = launchQueueStub.setConsumer.mock.calls[0][0];
    const { loadEnvironnement } = await import('@controllers/Core/Environment');
    const { OpenFileManager } = await import(
      '@controllers/Core/Managers/OpenFileManager'
    );

    loadEnvironnement.mockRejectedValueOnce(new Error('env KO'));

    await consumer({
      files: [{ name: 'bad.agg' }, { name: 'figure.agl' }],
    });

    expect(loadEnvironnement).toHaveBeenCalledWith('Grandeurs');
    expect(loadEnvironnement).toHaveBeenCalledWith('Geometrie');
    expect(OpenFileManager.newReadFile).toHaveBeenCalledTimes(1);
  });
});
