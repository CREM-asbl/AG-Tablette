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
      tool: {
        currentStep: 'selectAxis',
        axisAngle: Math.PI / 2,
        selectedShapeId: 'test-circle-id',
      },
    },
    setState: vi.fn(),
  };
});

describe('ReverseTool - Animation avec zoom', () => {
  let reverseTool;
  let circle;

  beforeEach(async () => {
    const { app } = await import('../../../src/controllers/Core/App');
    // Initialiser window.app pour que Shape/Point y accèdent
    window.app = app;

    app.mainCanvasLayer.shapes = [];
    app.mainCanvasLayer.segments = [];
    app.mainCanvasLayer.points = [];
    app.upperCanvasLayer.shapes = [];
    app.upperCanvasLayer.segments = [];
    app.upperCanvasLayer.points = [];

    app.workspace.zoomLevel = 1.0;
    app.tool.currentStep = 'selectAxis';
    app.tool.axisAngle = Math.PI / 2;

    reverseTool = new ReverseTool();
  });

  it('devrait calculer les bonnes coordonnées tangentes pour un cercle avec zoom 1x', async () => {
    const { app } = await import('../../../src/controllers/Core/App');
    app.workspace.zoomLevel = 1;

    const centerCoord = new Coordinates({ x: 100, y: 100 });
    const radius = 50;

    circle = new RegularShape({
      layer: 'main',
      name: 'Circle',
      familyName: 'circle',
      path: `M ${centerCoord.x + radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x - radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x + radius} ${centerCoord.y} Z`,
    });

    const arcSeg = circle.segments[0];
    reverseTool.center = centerCoord;
    const axisAngle = Math.PI / 2; // vertical

    // Créer l'axe
    const axis = reverseTool.createAxis(axisAngle);
    const axisSegment = axis.segments[0];

    // Calculer le point tangent perpendiculaire à l'axe (angle + PI/2)
    // Pour un axe vertical (PI/2), le point tangent sera à gauche du cercle (angle = PI)
    const tangentCoord1 = arcSeg.centerProjectionOnSegment(axisAngle + Math.PI / 2);

    // Le point tangent devrait être à gauche du cercle (50, 100)
    expect(tangentCoord1.x).toBeCloseTo(centerCoord.x - radius, 1);
    expect(tangentCoord1.y).toBeCloseTo(centerCoord.y, 1);

    // Calculer la projection sur l'axe
    const projection = axisSegment.projectionOnSegment(tangentCoord1);

    // La projection devrait être au centre (100, 100) car l'axe est vertical à x=100
    expect(projection.x).toBeCloseTo(centerCoord.x, 1);
    expect(projection.y).toBeCloseTo(centerCoord.y, 1);

    // Calculer les coordonnées finales après symétrie
    const endX = tangentCoord1.x + 2 * (projection.x - tangentCoord1.x);
    const endY = tangentCoord1.y + 2 * (projection.y - tangentCoord1.y);

    // Le point final devrait être à droite du cercle (150, 100)
    expect(endX).toBeCloseTo(centerCoord.x + radius, 1);
    expect(endY).toBeCloseTo(centerCoord.y, 1);
  });

  it('devrait calculer les bonnes coordonnées tangentes pour un cercle avec zoom 2x', async () => {
    const { app } = await import('../../../src/controllers/Core/App');
    app.workspace.zoomLevel = 2;

    const centerCoord = new Coordinates({ x: 100, y: 100 });
    const radius = 50;

    circle = new RegularShape({
      layer: 'main',
      name: 'Circle',
      familyName: 'circle',
      path: `M ${centerCoord.x + radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x - radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x + radius} ${centerCoord.y} Z`,
    });

    const arcSeg = circle.segments[0];
    reverseTool.center = centerCoord;
    const axisAngle = Math.PI / 2; // vertical

    // Créer l'axe avec zoom 2x
    const axis = reverseTool.createAxis(axisAngle);
    const axisSegment = axis.segments[0];

    // Vérifier que l'axe a la bonne longueur en coordonnées logiques
    const axisLength = axisSegment.vertexes[0].coordinates.dist(axisSegment.vertexes[1].coordinates);
    expect(axisLength).toBeCloseTo(reverseTool.axisLength / 2, 1);

    // Calculer le point tangent perpendiculaire à l'axe (NE DEVRAIT PAS CHANGER avec le zoom)
    const tangentCoord1 = arcSeg.centerProjectionOnSegment(axisAngle + Math.PI / 2);

    // Le point tangent devrait toujours être à gauche du cercle (50, 100)
    expect(tangentCoord1.x).toBeCloseTo(centerCoord.x - radius, 1);
    expect(tangentCoord1.y).toBeCloseTo(centerCoord.y, 1);

    // Calculer la projection sur l'axe
    const projection = axisSegment.projectionOnSegment(tangentCoord1);

    // La projection devrait toujours être au centre (100, 100)
    expect(projection.x).toBeCloseTo(centerCoord.x, 1);
    expect(projection.y).toBeCloseTo(centerCoord.y, 1);

    // Calculer les coordonnées finales après symétrie
    const endX = tangentCoord1.x + 2 * (projection.x - tangentCoord1.x);
    const endY = tangentCoord1.y + 2 * (projection.y - tangentCoord1.y);

    // Le point final devrait toujours être à droite du cercle (150, 100)
    expect(endX).toBeCloseTo(centerCoord.x + radius, 1);
    expect(endY).toBeCloseTo(centerCoord.y, 1);
  });

  it('devrait animer correctement le retournement avec zoom', async () => {
    const { app } = await import('../../../src/controllers/Core/App');

    const zooms = [1, 2, 3];

    zooms.forEach(zoom => {
      app.workspace.zoomLevel = zoom;
      app.mainCanvasLayer.shapes = [];
      app.mainCanvasLayer.segments = [];
      app.mainCanvasLayer.points = [];

      const centerCoord = new Coordinates({ x: 100, y: 100 });
      const radius = 50;

      circle = new RegularShape({
        layer: 'main',
        name: 'Circle',
        familyName: 'circle',
        path: `M ${centerCoord.x + radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x - radius} ${centerCoord.y} A ${radius} ${radius} 0 0 0 ${centerCoord.x + radius} ${centerCoord.y} Z`,
      });

      const arcSeg = circle.segments[0];
      reverseTool.center = centerCoord;
      const axisAngle = Math.PI / 2;

      // Créer l'axe
      const axis = reverseTool.createAxis(axisAngle);
      const axisSegment = axis.segments[0];

      // Simuler le calcul fait dans objectSelected - avec l'angle perpendiculaire
      const tangentCoord1 = arcSeg.centerProjectionOnSegment(axisAngle + Math.PI / 2);
      const projection = axisSegment.projectionOnSegment(tangentCoord1);

      const startCoord = new Coordinates(tangentCoord1);
      const endCoord = new Coordinates({
        x: tangentCoord1.x + 2 * (projection.x - tangentCoord1.x),
        y: tangentCoord1.y + 2 * (projection.y - tangentCoord1.y),
      });

      // Vérifier que le point de départ est à gauche du cercle
      expect(startCoord.x).toBeCloseTo(centerCoord.x - radius, 1);
      expect(startCoord.y).toBeCloseTo(centerCoord.y, 1);

      // Vérifier que le point final est à droite du cercle
      expect(endCoord.x).toBeCloseTo(centerCoord.x + radius, 1);
      expect(endCoord.y).toBeCloseTo(centerCoord.y, 1);

      // Tester l'interpolation au milieu de l'animation (progress = 0.5)
      const progress = 0.5;
      const progressInAnimation = Math.cos(Math.PI * (1 - progress)) / 2 + 0.5;

      const animatedCoord = startCoord.substract(
        startCoord.substract(endCoord).multiply(progressInAnimation)
      );

      // Au milieu de l'animation, le point devrait être au centre
      expect(animatedCoord.x).toBeCloseTo(centerCoord.x, 1,
        `Zoom ${zoom}: Point X au milieu de l'animation devrait être au centre`);
      expect(animatedCoord.y).toBeCloseTo(centerCoord.y, 1,
        `Zoom ${zoom}: Point Y au milieu de l'animation devrait être au centre`);
    });
  });
});
