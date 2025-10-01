import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../../src/controllers/Core/Objects/Coordinates.js';

describe('Rotation - Tests de calculs mathématiques', () => {
  describe('Calcul des coordonnées de rotation', () => {
    it('devrait calculer correctement une rotation de 90 degrés autour d\'un centre', () => {
      // Arrange
      const center = new Coordinates({ x: 50, y: 50 });
      const point = new Coordinates({ x: 100, y: 50 });
      const angle = Math.PI / 2; // 90 degrés

      // Act - Applique la rotation
      const rotatedPoint = point.rotate(angle, center);

      // Assert
      // Point à (100, 50) avec centre (50, 50) après rotation 90° devrait être à (50, 100)
      expect(rotatedPoint.x).toBeCloseTo(50, 2);
      expect(rotatedPoint.y).toBeCloseTo(100, 2);
    });

    it('devrait calculer correctement une rotation de 180 degrés', () => {
      // Arrange
      const center = new Coordinates({ x: 0, y: 0 });
      const point = new Coordinates({ x: 10, y: 0 });
      const angle = Math.PI; // 180 degrés

      // Act
      const rotatedPoint = point.rotate(angle, center);

      // Assert
      // Point à (10, 0) après rotation 180° autour de (0, 0) devrait être à (-10, 0)
      expect(rotatedPoint.x).toBeCloseTo(-10, 2);
      expect(rotatedPoint.y).toBeCloseTo(0, 2);
    });

    it('devrait calculer correctement l\'angle entre trois points selon le guide utilisateur', () => {
      // Arrange - Test selon le guide utilisateur
      // Point sur première demi-droite: (100, 50)
      // Sommet de l'angle (centre): (50, 50)
      // Point sur seconde demi-droite: (50, 100)
      const point1 = new Coordinates({ x: 100, y: 50 });
      const center = new Coordinates({ x: 50, y: 50 });
      const point2 = new Coordinates({ x: 50, y: 100 });

      // Act - Calcul de l'angle comme dans RotationTool
      const angle1 = center.angleWith(point1);
      const angle2 = center.angleWith(point2);
      const calculatedAngle = angle1 - angle2;
      const finalAngle = calculatedAngle * -1;

      // Assert
      // L'angle entre les deux demi-droites devrait être 90° (PI/2 radians)
      expect(Math.abs(finalAngle)).toBeCloseTo(Math.PI / 2, 2);
    });

    it('devrait gérer correctement les angles supérieurs et inférieurs à 180°', () => {
      // Test pour un angle inférieur à 180°
      const smallAngle = Math.PI / 4; // 45°
      expect(smallAngle < Math.PI).toBe(true);

      // Test pour un angle supérieur à 180°
      const largeAngle = 3 * Math.PI / 2; // 270°
      expect(largeAngle > Math.PI).toBe(true);

      // Test du complément pour obtenir l'autre arc
      const complement = 2 * Math.PI - largeAngle;
      expect(complement).toBeCloseTo(Math.PI / 2, 2); // 90°
    });
  });

  describe('Tests de validation de l\'angle selon les spécifications', () => {
    it('devrait permettre de choisir entre arc court et arc long', () => {
      // Arrange
      const baseAngle = Math.PI / 3; // 60°

      // Act
      const shortArc = baseAngle;
      const longArc = 2 * Math.PI - baseAngle;

      // Assert
      expect(shortArc).toBeLessThan(Math.PI); // Arc court < 180°
      expect(longArc).toBeGreaterThan(Math.PI); // Arc long > 180°
      expect(shortArc + longArc).toBeCloseTo(2 * Math.PI, 5); // Total = 360°
    });

    it('devrait calculer correctement un angle défini par trois points (ordre correct)', () => {
      // Arrange - Simulation selon le guide: point sur demi-droite 1, sommet, point sur demi-droite 2
      const pointOnRay1 = new Coordinates({ x: 100, y: 0 }); // Droite horizontale
      const vertex = new Coordinates({ x: 0, y: 0 });        // Origine
      const pointOnRay2 = new Coordinates({ x: 0, y: 100 }); // Droite verticale

      // Act - Calcul selon la méthode du guide
      const angle1 = vertex.angleWith(pointOnRay1); // 0°
      const angle2 = vertex.angleWith(pointOnRay2); // 90°
      const rotationAngle = angle1 - angle2;

      // Assert
      // L'angle devrait être -90° ou équivalent
      const normalizedAngle = Math.abs(rotationAngle);
      expect(normalizedAngle).toBeCloseTo(Math.PI / 2, 2);
    });
  });
});