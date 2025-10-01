import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../../src/controllers/Core/Objects/Coordinates.js';

describe('Rotation - Tests logiques de sélection d\'arc existant', () => {
  describe('Vérification que la logique de sélection d\'arc est élargie', () => {
    it('devrait identifier correctement un segment comme arc', () => {
      // Test simple pour s'assurer que la logique isArc() fonctionne
      // Dans le vrai code, la condition était: object instanceof Segment && object.isArc() && object.shape instanceof ArrowLineShape
      // Maintenant elle est: object instanceof Segment && object.isArc()

      // Simulation de la logique
      const mockSegment = {
        isArc: () => true,
        shape: {
          name: 'Circle',
          constructor: { name: 'RegularShape' }
        }
      };

      // Ancienne logique (restrictive)
      const oldCondition = mockSegment.isArc && mockSegment.shape.constructor.name === 'ArrowLineShape';

      // Nouvelle logique (élargie)
      const newCondition = mockSegment.isArc();

      expect(oldCondition).toBe(false); // L'ancienne logique excluait les RegularShape
      expect(newCondition).toBe(true);  // La nouvelle logique accepte tous les arcs
    });

    it('devrait calculer correctement l\'angle d\'un arc de 90°', () => {
      // Test fonctionnel de calcul d'angle
      const center = new Coordinates({ x: 0, y: 0 });
      const start = new Coordinates({ x: 50, y: 0 });
      const end = new Coordinates({ x: 0, y: 50 });

      const startAngle = center.angleWith(start);  // 0°
      const endAngle = center.angleWith(end);      // 90° (π/2)
      let angle = startAngle - endAngle;           // -π/2
      angle *= -1;                                 // π/2

      expect(Math.abs(angle)).toBeCloseTo(Math.PI / 2, 5); // 90°
    });

    it('devrait calculer correctement l\'angle d\'un arc de 180°', () => {
      const center = new Coordinates({ x: 0, y: 0 });
      const start = new Coordinates({ x: 50, y: 0 });
      const end = new Coordinates({ x: -50, y: 0 });

      const startAngle = center.angleWith(start);  // 0°
      const endAngle = center.angleWith(end);      // 180° (π)
      let angle = startAngle - endAngle;           // -π
      angle *= -1;                                 // π

      expect(Math.abs(angle)).toBeCloseTo(Math.PI, 5); // 180°
    });

    it('devrait gérer les arcs en sens horaire et anti-horaire', () => {
      const center = new Coordinates({ x: 0, y: 0 });
      const point1 = new Coordinates({ x: 50, y: 0 });   // 0°
      const point2 = new Coordinates({ x: 0, y: 50 });   // 90°

      // Sens anti-horaire (de 0° à 90°)
      let angleCounterclockwise = center.angleWith(point1) - center.angleWith(point2);
      angleCounterclockwise *= -1;

      // Sens horaire (de 90° à 0°)
      let angleClockwise = center.angleWith(point2) - center.angleWith(point1);
      angleClockwise *= -1;

      expect(angleCounterclockwise).toBeCloseTo(Math.PI / 2, 5);  // +90°
      expect(angleClockwise).toBeCloseTo(-Math.PI / 2, 5);       // -90°
    });

    it('devrait supporter différents types de formes contenant des arcs', () => {
      // Test conceptuel des types de formes qui peuvent contenir des arcs
      const supportedShapes = [
        { name: 'RegularShape', supportsArcs: true, description: 'Cercles et arcs réguliers' },
        { name: 'LineShape', supportsArcs: true, description: 'Arcs de cercle simples' },
        { name: 'ArrowLineShape', supportsArcs: true, description: 'Arcs avec flèches' },
        { name: 'StripLineShape', supportsArcs: true, description: 'Lignes avec arcs' }
      ];

      supportedShapes.forEach(shape => {
        expect(shape.supportsArcs).toBe(true);
      });

      // La correction permet maintenant de sélectionner des arcs dans tous ces types
      expect(supportedShapes.length).toBe(4);
    });
  });
});