import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Coordinates } from '../../../src/controllers/Core/Objects/Coordinates';
import { RegularShape } from '../../../src/controllers/Core/Objects/Shapes/RegularShape';
import { ReverseTool } from '../../../src/controllers/Reverse/ReverseTool';

// Mock de l'application
vi.mock('../../../src/controllers/Core/App', () => {
  return {
    app: {
      workspace: {
        zoomLevel: 1.0,
        translateOffset: { x: 0, y: 0 },
      },
      settings: {},
      environment: { name: 'Grandeurs' },
      mainCanvasLayer: {
        shapes: [],
        segments: [],
        points: [],
      },
      upperCanvasLayer: {
        shapes: [],
        segments: [],
        points: [],
      },
    },
    setState: vi.fn(),
  };
});

describe('ReverseTool - Gestion du zoom pour cercles', () => {
  let reverseTool;
  let circle;

  beforeEach(async () => {
    // Récupérer le mock d'app
    const { app } = await import('../../../src/controllers/Core/App');
    // Initialiser window.app pour que Shape/Point y accèdent
    window.app = app;

    // Réinitialiser les canvases
    app.mainCanvasLayer.shapes = [];
    app.mainCanvasLayer.segments = [];
    app.mainCanvasLayer.points = [];
    app.upperCanvasLayer.shapes = [];
    app.upperCanvasLayer.segments = [];
    app.upperCanvasLayer.points = [];

    // Réinitialiser le zoom
    app.workspace.zoomLevel = 1.0;

    // Créer l'outil reverse
    reverseTool = new ReverseTool();
  });

  it('devrait calculer correctement les coordonnées de retournement d\'un cercle sans zoom', async () => {
    // Récupérer le mock d'app
    const { app } = await import('../../../src/controllers/Core/App');

    // Définir le zoom à 1
    app.workspace.zoomLevel = 1;

    // Créer un cercle
    const center = new Coordinates({ x: 100, y: 100 });
    const radius = 50;
    circle = new RegularShape({
      layer: 'main',
      name: 'Circle',
      familyName: 'circle',
      path: `M ${center.x + radius} ${center.y} A ${radius} ${radius} 0 0 0 ${center.x - radius} ${center.y} A ${radius} ${radius} 0 0 0 ${center.x + radius} ${center.y} Z`,
    });

    // Vérifier le centre et le rayon
    expect(circle.centerCoordinates.x).toBeCloseTo(center.x, 1);
    expect(circle.centerCoordinates.y).toBeCloseTo(center.y, 1);
    expect(circle.segments[0].radius).toBeCloseTo(radius, 1);
  });

  it('devrait calculer correctement les coordonnées de retournement d\'un cercle avec zoom 2x', async () => {
    // Récupérer le mock d'app
    const { app } = await import('../../../src/controllers/Core/App');

    // Définir le zoom à 2
    app.workspace.zoomLevel = 2;

    // Créer un cercle (en coordonnées logiques)
    const center = new Coordinates({ x: 100, y: 100 });
    const radius = 50;
    circle = new RegularShape({
      layer: 'main',
      name: 'Circle',
      familyName: 'circle',
      path: `M ${center.x + radius} ${center.y} A ${radius} ${radius} 0 0 0 ${center.x - radius} ${center.y} A ${radius} ${radius} 0 0 0 ${center.x + radius} ${center.y} Z`,
    });

    // Les coordonnées logiques doivent rester les mêmes
    expect(circle.centerCoordinates.x).toBeCloseTo(center.x, 1);
    expect(circle.centerCoordinates.y).toBeCloseTo(center.y, 1);
    expect(circle.segments[0].radius).toBeCloseTo(radius, 1);

    // Les coordonnées canvas doivent être zoomées
    const canvasCenter = circle.centerCoordinates.toCanvasCoordinates();
    expect(canvasCenter.x).toBeCloseTo(center.x * 2, 1);
    expect(canvasCenter.y).toBeCloseTo(center.y * 2, 1);
  });

  it('devrait créer un axe avec la bonne longueur visuelle quel que soit le zoom', async () => {
    // Récupérer le mock d'app
    const { app } = await import('../../../src/controllers/Core/App');

    app.workspace.zoomLevel = 1;

    // Créer un cercle
    const center = new Coordinates({ x: 100, y: 100 });
    reverseTool.center = center;

    // Créer un axe vertical sans zoom
    const axis1 = reverseTool.createAxis(Math.PI / 2);
    const axisSegment1 = axis1.segments[0];
    const axisLength1 = axisSegment1.vertexes[0].coordinates.dist(axisSegment1.vertexes[1].coordinates);

    // Changer le zoom
    app.workspace.zoomLevel = 2;

    // Recréer un axe vertical avec zoom
    const axis2 = reverseTool.createAxis(Math.PI / 2);
    const axisSegment2 = axis2.segments[0];
    const axisLength2 = axisSegment2.vertexes[0].coordinates.dist(axisSegment2.vertexes[1].coordinates);

    // Avec zoom 2x, la longueur en coordonnées logiques devrait être divisée par 2
    // pour avoir la même taille visuelle (200 pixels)
    expect(axisLength1).toBeCloseTo(reverseTool.axisLength, 1);
    expect(axisLength2).toBeCloseTo(reverseTool.axisLength / 2, 1);

    // Mais les longueurs visuelles (en pixels canvas) devraient être les mêmes
    const visualLength1 = axisLength1 * 1;  // zoom 1
    const visualLength2 = axisLength2 * 2;  // zoom 2
    expect(visualLength1).toBeCloseTo(visualLength2, 1);
  });

  it('devrait calculer la bonne projection sur l\'axe pour un point du cercle avec zoom', async () => {
    // Récupérer le mock d'app
    const { app } = await import('../../../src/controllers/Core/App');

    // Test avec différents zooms
    const zooms = [0.5, 1, 1.5, 2, 3];

    zooms.forEach(zoom => {
      // Réinitialiser
      app.workspace.zoomLevel = zoom;
      app.mainCanvasLayer.shapes = [];
      app.mainCanvasLayer.segments = [];
      app.mainCanvasLayer.points = [];

      // Créer un cercle centré en (100, 100) avec rayon 50
      const centerCoord = new Coordinates({ x: 100, y: 100 });
      const radius = 50;
      circle = new RegularShape({
        layer: 'main',
        name: 'Circle',
        familyName: 'circle',
        path: `M ${centerCoord.x + radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x - radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x + radius} ${centerCoord.y} Z`,
      });

      reverseTool.center = centerCoord;

      // Créer un axe vertical (angle PI/2)
      const axis = reverseTool.createAxis(Math.PI / 2);
      const axisSegment = axis.segments[0];

      // Prendre le point le plus à droite du cercle (150, 100)
      const rightPoint = new Coordinates({ x: centerCoord.x + radius, y: centerCoord.y });

      // Calculer la projection sur l'axe vertical
      const projection = axisSegment.projectionOnSegment(rightPoint);

      // La projection devrait être au centre (100, 100) car l'axe est vertical et passe par le centre
      expect(projection.x).toBeCloseTo(centerCoord.x, 1,
        `Zoom ${zoom}: Projection X incorrecte`);
      expect(projection.y).toBeCloseTo(centerCoord.y, 1,
        `Zoom ${zoom}: Projection Y incorrecte`);

      // Calculer le point tangent comme dans ReverseTool
      const arcSegment = circle.segments[0];

      // Test avec angle PI/2 (direction vers le bas en coordonnées canvas: Y augmente vers le bas)
      const tangentCoordDown = arcSegment.centerProjectionOnSegment(Math.PI / 2);
      expect(tangentCoordDown.x).toBeCloseTo(centerCoord.x, 1,
        `Zoom ${zoom}: Tangent Down X incorrecte`);
      expect(tangentCoordDown.y).toBeCloseTo(centerCoord.y + radius, 1,
        `Zoom ${zoom}: Tangent Down Y incorrecte - devrait être ${centerCoord.y + radius}`);

      // Test avec angle 3*PI/2 ou -PI/2 (direction vers le haut)
      const tangentCoordUp = arcSegment.centerProjectionOnSegment(3 * Math.PI / 2);
      expect(tangentCoordUp.x).toBeCloseTo(centerCoord.x, 1,
        `Zoom ${zoom}: Tangent Up X incorrecte`);
      expect(tangentCoordUp.y).toBeCloseTo(centerCoord.y - radius, 1,
        `Zoom ${zoom}: Tangent Up Y incorrecte`);
    });
  });
});
