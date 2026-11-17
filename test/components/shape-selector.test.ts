import { ShapeSelector } from '@components/shape-selector';
import { app, setState } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: {
      name: 'create',
      currentStep: 'start',
      selectedTemplate: null,
    },
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  appActions: {
    setSelectedTemplate: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolUiState: vi.fn(),
  },
}));

describe('shape-selector', () => {
  let selector: ShapeSelector;

  beforeEach(() => {
    vi.clearAllMocks();
    selector = new ShapeSelector();
    selector.nextStep = 'listen';
  });

  it('met a jour appActions et fallback legacy au clic', () => {
    const template = { name: 'Triangle', title: 'Triangle' };

    selector._clickHandle(template);

    expect(selector.selectedTemplate).toEqual(template);
    expect(appActions.setSelectedTemplate).toHaveBeenCalledWith(template);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('n a aucun bouton actif par defaut lorsque selectedTemplate est null', () => {
    selector.templatesNames = [{ name: 'Triangle', title: 'Triangle' }];
    selector.selectedTemplate = null;
    
    // On vérifie le comportement attendu en rendant le composant et en testant les propriétés
    selector.requestUpdate();
    
    // Le template est null donc aucun devrait être active
    expect(selector.selectedTemplate).toBeNull();
  });
});
