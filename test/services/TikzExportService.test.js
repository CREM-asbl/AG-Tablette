import { describe, expect, it } from 'vitest';
import {
  createTikzBlob,
  generateTikzDocument,
  hexToTikzColor,
} from '../../src/services/TikzExportService.js';

describe('TikzExportService', () => {
  it('hexToTikzColor devrait mapper les couleurs standards et custom', () => {
    expect(hexToTikzColor('#000')).toBe('black');
    expect(hexToTikzColor('#0f0')).toBe('green');
    expect(hexToTikzColor('#123456')).toBe('customColor123456');
    expect(hexToTikzColor('not-a-color')).toBe('black');
    expect(hexToTikzColor(null)).toBe('black');
  });

  it('generateTikzDocument devrait retourner une chaine vide si app invalide', () => {
    expect(generateTikzDocument(null)).toBe('');
    expect(generateTikzDocument({})).toBe('');
  });

  it('generateTikzDocument devrait générer un document latex complet avec formes, segments et points', () => {
    const p1 = { id: 'p1', coordinates: { x: 0, y: 0 }, visible: true, color: '#000000', size: 2 };
    const p2 = { id: 'p2', coordinates: { x: 10, y: 0 }, visible: true, color: '#000000', size: 2 };
    const p3 = { id: 'p3', coordinates: { x: 5, y: 10 }, visible: true, color: '#000000', size: 2 };

    const app = {
      mainCanvasLayer: {
        points: [p1],
        shapes: [
          {
            id: 'shape1',
            strokeColor: '#ff0000',
            strokeWidth: 2,
            fillColor: '#123456',
            fillOpacity: 0.5,
            vertexes: [p1, p2, p3],
            segments: [],
          },
        ],
        segments: [
          {
            id: 's1',
            shapeId: 'shape1',
            vertexIds: ['p1', 'p2'],
            color: '#00ff00',
            width: 3,
          },
        ],
      },
    };

    const output = generateTikzDocument(app);

    expect(output).toContain('\\documentclass{standalone}');
    expect(output).toContain('\\begin{tikzpicture}');
    expect(output).toContain('% Formes');
    expect(output).toContain('% Segments');
    expect(output).toContain('% Points (et sommets des figures)');
    expect(output).toContain('\\draw');
    expect(output).toContain('-- cycle;');
    expect(output).toContain('\\filldraw');
    expect(output).toContain('definecolor{customColor123456}{RGB}{18,52,86}');
  });

  it('generateTikzDocument ne devrait pas exporter les formes cachées', () => {
    const app = {
      mainCanvasLayer: {
        points: [],
        segments: [],
        shapes: [
          {
            id: 'hidden-shape',
            strokeColor: '#ff0000',
            vertexes: [
              { id: 'a', coordinates: { x: 0, y: 0 } },
              { id: 'b', coordinates: { x: 1, y: 0 } },
            ],
            geometryObject: {
              geometryIsHidden: true,
            },
          },
        ],
      },
    };

    const output = generateTikzDocument(app);
    expect(output).not.toContain('hidden-shape');
    expect(output).not.toContain('-- cycle;');
  });

  it('createTikzBlob devrait retourner un Blob tikz contenant le document', async () => {
    const app = {
      mainCanvasLayer: {
        points: [],
        shapes: [],
        segments: [],
      },
    };

    const blob = createTikzBlob(app);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/x-tikz');

    const content = await blob.text();
    expect(content).toContain('\\begin{document}');
    expect(content).toContain('\\end{document}');
  });
});
