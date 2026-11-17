/**
 * Système de validation avancée pour AG-Tablette
 * Fournit des validateurs réutilisables et composables
 */

/**
 * Types de validation disponibles
 */
export const ValidationTypes = {
  REQUIRED: 'required',
  TYPE: 'type',
  RANGE: 'range',
  FORMAT: 'format',
  CUSTOM: 'custom',
  ARRAY: 'array',
  OBJECT: 'object',
};

/**
 * Messages d'erreur par défaut
 */
const defaultMessages = {
  required: 'Ce champ est requis',
  type: 'Type de données incorrect',
  range: 'Valeur hors de la plage autorisée',
  format: 'Format incorrect',
  custom: 'Validation personnalisée échouée',
  array: 'Doit être un tableau',
  object: 'Doit être un objet',
};

/**
 * Classe pour représenter une erreur de validation
 */
export class ValidationError extends Error {
  constructor(field, type, message, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.type = type;
    this.value = value;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      field: this.field,
      type: this.type,
      message: this.message,
      value: this.value,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Résultat de validation
 */
export class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
  }

  addError(field, type, message, value = null) {
    this.isValid = false;
    this.errors.push(new ValidationError(field, type, message, value));
  }

  addWarning(field, message, value = null) {
    this.warnings.push({
      field,
      message,
      value,
      timestamp: Date.now(),
    });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }

  getErrorsForField(field) {
    return this.errors.filter((error) => error.field === field);
  }

  getAllMessages() {
    return [
      ...this.errors.map((e) => e.message),
      ...this.warnings.map((w) => w.message),
    ];
  }

  toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors.map((e) => e.toJSON()),
      warnings: this.warnings,
    };
  }
}

/**
 * Validateurs de base
 */
export const baseValidators = {
  /**
   * Valider qu'une valeur est requise
   */
  required: (value, options = {}) => {
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0);

    return {
      isValid: !isEmpty,
      message: options.message || defaultMessages.required,
    };
  },

  /**
   * Valider le type de données
   */
  type: (value, options = {}) => {
    const { expectedType } = options;
    let isValid = false;

    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'object':
        isValid =
          typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'function':
        isValid = typeof value === 'function';
        break;
      case 'coordinate':
        isValid =
          typeof value === 'object' &&
          value !== null &&
          typeof value.x === 'number' &&
          typeof value.y === 'number';
        break;
      default:
        isValid = typeof value === expectedType;
    }

    return {
      isValid,
      message:
        options.message || `Attendu: ${expectedType}, reçu: ${typeof value}`,
    };
  },

  /**
   * Valider une plage de valeurs
   */
  range: (value, options = {}) => {
    const { min, max } = options;
    let isValid = true;

    if (typeof value !== 'number') {
      return {
        isValid: false,
        message: 'La valeur doit être un nombre pour la validation de plage',
      };
    }

    if (min !== undefined && value < min) {
      isValid = false;
    }
    if (max !== undefined && value > max) {
      isValid = false;
    }

    return {
      isValid,
      message:
        options.message ||
        `Valeur doit être entre ${min || '-∞'} et ${max || '+∞'}`,
    };
  },

  /**
   * Valider un format avec regex
   */
  format: (value, options = {}) => {
    const { pattern, flags = '' } = options;

    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: 'La valeur doit être une chaîne pour la validation de format',
      };
    }

    const regex = new RegExp(pattern, flags);
    const isValid = regex.test(value);

    return {
      isValid,
      message: options.message || defaultMessages.format,
    };
  },

  /**
   * Validation personnalisée
   */
  custom: (value, options = {}) => {
    const { validator } = options;

    if (typeof validator !== 'function') {
      throw new Error('Validator doit être une fonction');
    }

    try {
      const result = validator(value);

      // Support pour retour boolean ou objet
      if (typeof result === 'boolean') {
        return {
          isValid: result,
          message: options.message || defaultMessages.custom,
        };
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        message: `Erreur de validation: ${error.message}`,
      };
    }
  },
};

/**
 * Validateurs spécialisés pour AG-Tablette
 */
export const geometryValidators = {
  /**
   * Valider une coordonnée
   */
  coordinate: (value, options = {}) => {
    const typeResult = baseValidators.type(value, {
      expectedType: 'coordinate',
    });
    if (!typeResult.isValid) {
      return typeResult;
    }

    const { bounds } = options;
    if (bounds) {
      if (
        value.x < bounds.minX ||
        value.x > bounds.maxX ||
        value.y < bounds.minY ||
        value.y > bounds.maxY
      ) {
        return {
          isValid: false,
          message: 'Coordonnée hors des limites',
        };
      }
    }

    return { isValid: true };
  },

  /**
   * Valider un point
   */
  point: (value, options = {}) => {
    if (!value || typeof value !== 'object') {
      return {
        isValid: false,
        message: 'Point invalide',
      };
    }

    // Vérifier les coordonnées
    const coordResult = geometryValidators.coordinate(value, options);
    if (!coordResult.isValid) {
      return coordResult;
    }

    // Vérifier les propriétés supplémentaires
    if (options.requireId && !value.id) {
      return {
        isValid: false,
        message: 'Point doit avoir un ID',
      };
    }

    return { isValid: true };
  },

  /**
   * Valider une forme géométrique
   */
  shape: (value, options = {}) => {
    if (!value || typeof value !== 'object') {
      return {
        isValid: false,
        message: 'Forme invalide',
      };
    }

    // Vérifications de base
    if (!value.id) {
      return {
        isValid: false,
        message: 'Forme doit avoir un ID',
      };
    }

    if (!value.type) {
      return {
        isValid: false,
        message: 'Forme doit avoir un type',
      };
    }

    // Vérifier les points selon le type
    const { minPoints, maxPoints } = options;
    if (value.points) {
      if (minPoints && value.points.length < minPoints) {
        return {
          isValid: false,
          message: `Forme nécessite au moins ${minPoints} points`,
        };
      }
      if (maxPoints && value.points.length > maxPoints) {
        return {
          isValid: false,
          message: `Forme ne peut avoir plus de ${maxPoints} points`,
        };
      }

      // Valider chaque point
      for (let i = 0; i < value.points.length; i++) {
        const pointResult = geometryValidators.point(value.points[i], options);
        if (!pointResult.isValid) {
          return {
            isValid: false,
            message: `Point ${i} invalide: ${pointResult.message}`,
          };
        }
      }
    }

    return { isValid: true };
  },

  /**
   * Valider une couleur
   */
  color: (value, options = {}) => {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: 'Couleur doit être une chaîne',
      };
    }

    // Formats supportés: hex, rgb, rgba, noms CSS
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;

    const isValid =
      hexPattern.test(value) ||
      rgbPattern.test(value) ||
      rgbaPattern.test(value) ||
      CSS.supports('color', value);

    return {
      isValid,
      message: 'Format de couleur invalide',
    };
  },
};

/**
 * Classe principale de validation
 */
export class Validator {
  constructor() {
    this.rules = new Map();
    this.schemas = new Map();
  }

  /**
   * Ajouter une règle de validation
   * @param {string} name - Nom de la règle
   * @param {Function} validator - Fonction de validation
   */
  addRule(name, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator doit être une fonction');
    }
    this.rules.set(name, validator);
  }

  /**
   * Définir un schéma de validation
   * @param {string} name - Nom du schéma
   * @param {object} schema - Définition du schéma
   */
  defineSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Valider une valeur selon des règles
   * @param {any} value - Valeur à valider
   * @param {array} rules - Règles de validation
   * @param {string} fieldName - Nom du champ
   * @returns {ValidationResult}
   */
  validate(value, rules, fieldName = 'value') {
    const result = new ValidationResult();

    for (const rule of rules) {
      const { type, options = {}, message } = rule;

      let validator;
      if (baseValidators[type]) {
        validator = baseValidators[type];
      } else if (geometryValidators[type]) {
        validator = geometryValidators[type];
      } else if (this.rules.has(type)) {
        validator = this.rules.get(type);
      } else {
        result.addError(
          fieldName,
          'unknown',
          `Règle de validation inconnue: ${type}`,
        );
        continue;
      }

      try {
        const validationResult = validator(value, { ...options, message });

        if (!validationResult.isValid) {
          result.addError(fieldName, type, validationResult.message, value);
        }

        if (validationResult.warning) {
          result.addWarning(fieldName, validationResult.warning, value);
        }
      } catch (error) {
        result.addError(
          fieldName,
          type,
          `Erreur de validation: ${error.message}`,
          value,
        );
      }
    }

    return result;
  }

  /**
   * Valider un objet selon un schéma
   * @param {object} data - Données à valider
   * @param {string|object} schema - Nom du schéma ou définition directe
   * @returns {ValidationResult}
   */
  validateSchema(data, schema) {
    const result = new ValidationResult();

    // Récupérer le schéma
    let schemaDefinition;
    if (typeof schema === 'string') {
      schemaDefinition = this.schemas.get(schema);
      if (!schemaDefinition) {
        result.addError('schema', 'unknown', `Schéma inconnu: ${schema}`);
        return result;
      }
    } else {
      schemaDefinition = schema;
    }

    // Valider chaque champ
    for (const [fieldName, fieldRules] of Object.entries(schemaDefinition)) {
      const fieldValue = this.getNestedValue(data, fieldName);
      const fieldResult = this.validate(fieldValue, fieldRules, fieldName);

      // Fusionner les résultats
      result.errors.push(...fieldResult.errors);
      result.warnings.push(...fieldResult.warnings);

      if (fieldResult.hasErrors()) {
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Obtenir une valeur imbriquée dans un objet
   * @param {object} obj - Objet source
   * @param {string} path - Chemin vers la valeur (ex: 'user.name')
   * @returns {any} Valeur trouvée
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Valider de manière asynchrone
   * @param {any} value - Valeur à valider
   * @param {array} rules - Règles de validation
   * @param {string} fieldName - Nom du champ
   * @returns {Promise<ValidationResult>}
   */
  async validateAsync(value, rules, fieldName = 'value') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.validate(value, rules, fieldName));
      }, 0);
    });
  }

  /**
   * Obtenir les statistiques de validation
   * @returns {object}
   */
  getStats() {
    return {
      customRules: this.rules.size,
      schemas: this.schemas.size,
      availableValidators: Object.keys(baseValidators).concat(
        Object.keys(geometryValidators),
      ),
    };
  }
}

/**
 * Instance singleton du validateur
 */
export const validator = new Validator();

/**
 * Schémas prédéfinis pour AG-Tablette
 */
export const predefinedSchemas = {
  point: {
    x: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'number' } },
    ],
    y: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'number' } },
    ],
    id: [{ type: 'type', options: { expectedType: 'string' } }],
  },

  shape: {
    id: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'string' } },
    ],
    type: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'string' } },
    ],
    points: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'array' } },
    ],
    color: [{ type: 'color' }],
  },

  toolConfig: {
    name: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'string' } },
    ],
    family: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'string' } },
    ],
    options: [{ type: 'type', options: { expectedType: 'object' } }],
  },

  environment: {
    name: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'string' } },
    ],
    modules: [
      { type: 'required' },
      { type: 'type', options: { expectedType: 'array' } },
    ],
  },
};

// Enregistrer les schémas prédéfinis
Object.entries(predefinedSchemas).forEach(([name, schema]) => {
  validator.defineSchema(name, schema);
});

/**
 * Fonctions utilitaires de validation
 */
export const validationUtils = {
  /**
   * Valider rapidement une coordonnée
   */
  isValidCoordinate: (coord) => {
    const result = geometryValidators.coordinate(coord);
    return result.isValid;
  },

  /**
   * Valider rapidement une couleur
   */
  isValidColor: (color) => {
    const result = geometryValidators.color(color);
    return result.isValid;
  },

  /**
   * Créer un validateur pour une plage
   */
  createRangeValidator: (min, max) => {
    return (value) => baseValidators.range(value, { min, max });
  },

  /**
   * Créer un validateur d'énumération
   */
  createEnumValidator: (allowedValues) => {
    return (value) => ({
      isValid: allowedValues.includes(value),
      message: `Valeur doit être l'une de: ${allowedValues.join(', ')}`,
    });
  },
};
