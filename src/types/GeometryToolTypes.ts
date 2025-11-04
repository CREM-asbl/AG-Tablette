/**
 * Interface TypeScript pour standardiser les outils géométriques
 * Définit les méthodes et propriétés communes à tous les outils
 */

export interface IGeometryTool {
  name: string;
  title: string;
  type: string;
  currentStep: string | null;

  // Méthodes de cycle de vie
  start(): void;
  end(): void;

  // Méthodes d'interaction
  canvasMouseDown(): void;
  canvasMouseUp(): void;

  // Méthodes de rendu
  refreshStateUpper(): void;

  // Méthodes d'aide
  getHelpText(): string;

  // Exécution des actions
  executeAction(): void | Promise<void>;
}

export interface IShapeCreationTool extends IGeometryTool {
  points: any[];
  segments: any[];
  numberOfPointsDrawn: number;
  constraints: any;

  // Méthodes spécifiques à la création de formes
  drawPoint(): void;
  animatePoint(): void;
  adjustPoint(point: any): void;
  getConstraints(pointNumber: number): void;
  numberOfPointsRequired(): number;
}

export interface IToolDefinition {
  numberOfPointsRequired: number;
  constraints: Function[];
  finishShape?: Function;
}

/**
 * Type pour les coordonnées
 */
export interface ICoordinates {
  x: number;
  y: number;
  toCanvasCoordinates?(): ICoordinates;
  fromCanvasCoordinates?(): ICoordinates;
  dist?(other: ICoordinates): number;
}

/**
 * Type pour les points
 */
export interface IPoint {
  id: string;
  coordinates: ICoordinates;
  adjustedOn?: any;
  layer: string;
  color?: string;
  size?: number;
  type?: string;
}

/**
 * Type pour les contraintes
 */
export interface IConstraints {
  type: 'isFree' | 'isConstrained';
  isFree?: boolean;
  segments?: any[];
  projectionOnConstraints?(
    coordinates: ICoordinates,
    validate?: boolean,
  ): ICoordinates | boolean;
}

/**
 * Interface pour les gestionnaires d'état
 */
export interface IStateManager {
  currentState: string;
  previousState?: string;
  transition(newState: string, data?: any): void;
  rollback(): void;
  validateTransition(newState: string): boolean;
}

/**
 * Interface pour les gestionnaires de performances
 */
export interface IPerformanceManager {
  throttle: number;
  lastExecution: number;
  execute(fn: Function): void;
  scheduleExecution(fn: Function): void;
  cancelScheduled(): void;
}

/**
 * Interface pour la validation
 */
export interface IValidator {
  validateInput(data: any): boolean;
  validateCoordinates(coords: ICoordinates): boolean;
  validateTool(tool: IGeometryTool): boolean;
  getValidationErrors(): string[];
}
