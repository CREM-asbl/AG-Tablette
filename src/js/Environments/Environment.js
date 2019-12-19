import { Family } from '../Objects/Family';
import { Segment } from '../Objects/Segment';

/**
 * Environnement de travail: Grandeur, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor(name) {
    if (this.constructor === Environment) {
      throw new TypeError('Abstract class "Environment" cannot be instantiated directly');
    }

    //Nom de l'environnement
    this.name = name;

    //Liste des familles de formes disponibles dans cet environnement
    this.families = [];

    this.familyNames = [];

    //TODO: outils activés/désactivés, etc.
  }

  /**
   * Vérifie qu'un kit de familles est sémentiquement correct.
   * -Chaque famille doit avoir les propriétés color et shapes. (1)
   * -Chaque objet du tableau shapes doit avoir les propriétés name et steps.
   *  Il peut aussi avoir la propriété color. (2)
   * -Le tableau steps ne contient que des objets ayant les propriétés type,
   *  x, y et isArc (optionnel). x et y sont des nombres, et type une chaîne
   *  de caractère valant moveTo, vertex ou segment. isArc est défini et
   *  vaut true si type vaut segment. Sinon, isArc n'est pas défini. (3)
   * -Le tableau steps doit commencer par un élément moveTo. (4)
   * -Il ne peut pas y avoir 2 éléments de type segment l'un à la suite de
   *  l'autre, sauf s'il s'agit de DEUX segments de type arc. Il ne peut donc
   *  pas y avoir un segment normal et un segment de type arc qui se suivent. (5)
   * -Le tableau steps doit contenir au moins 2 éléments. (6)
   * @param  {[type]} kit
   * @return {Boolean}     true si valide, false sinon
   */
  checkKitStructure(kit) {
    return true;
    // for (let familyName of Object.keys(kit)) {
    //   let familyData = kit[familyName];
    //   if (!familyData.color || !familyData.shapes) {
    //     //(1)
    //     console.error(familyName + ' - bad kit structure');
    //     return false;
    //   }
    //   if (
    //     !familyData.shapes.every(shape => {
    //       if (!shape.name || !shape.steps) {
    //         //(2)
    //         console.error(familyName + ' - bad kit structure');
    //         return false;
    //       }
    //       if (
    //         !shape.steps.every(step => {
    //           if (!step.type || !Number.isFinite(step.x) || !Number.isFinite(step.y)) {
    //             //(3)
    //             console.error(familyName + ' - bad kit structure');
    //             return false;
    //           }
    //           if (step.type != 'moveTo' && step.type != 'vertex' && step.type != 'segment') {
    //             //(3)
    //             console.error(familyName + ' - bad kit structure');
    //             return false;
    //           }
    //           if (
    //             step.type == 'segment' &&
    //             step.isArc !== undefined &&
    //             step.isArc !== false &&
    //             step.isArc !== true
    //           ) {
    //             //(3)
    //             console.error(familyName + ' - bad kit structure');
    //             return false;
    //           }
    //           if (step.type != 'segment' && step.isArc !== undefined) {
    //             //(3)
    //             console.error(familyName + ' - bad kit structure');
    //             return false;
    //           }
    //           return true;
    //         })
    //       )
    //         return false;
    //       if (shape.steps[0].type != 'moveTo') {
    //         //(4)
    //         console.error(familyName + ' - bad kit structure');
    //         return false;
    //       }
    //       for (let i = 1; i < shape.steps.length; i++) {
    //         let s1 = shape.steps[i - 1],
    //           s2 = shape.steps[i];
    //         if (s1.type == 'vertex' && s2.type == 'vertex') {
    //           if (s1.isArc !== true && s2.isArc !== true) {
    //             //(5)
    //             console.error(familyName + ' - bad kit structure');
    //             return false;
    //           }
    //         }
    //       }
    //       if (shape.steps.length < 2) {
    //         //(6)
    //         console.error(familyName + ' - bad kit structure');
    //         return false;
    //       }
    //       return true;
    //     })
    //   )
    //     return false;
    // }
    // return true;
  }

  /**
   * Charger les familles de l'environnement à partir d'un kit
   * @param  {Data} kit données du kit à charger
   */
  loadFamilies(kit) {
    if (!this.checkKitStructure(kit)) return false;

    for (let familyName of Object.keys(kit)) {
      let familyData = kit[familyName];
      let family = new Family(familyName, familyData.color);
      familyData.shapes.forEach(shape => {
        family.addShape(shape.name, shape.segments, shape.color);
      });
      this.families.push(family);
      this.familyNames.push(familyName);
    }
  }

  /**
   * Renvoie la liste des noms des familles de formes
   * @return liste des noms ([String])
   */
  getFamiliesNames() {
    return this.families.map(f => f.name);
  }

  /**
   * Récupère une famille à partir de son nom
   * @param name: le nom de la famille (String)
   * @return la famille (Family)
   */
  getFamily(name) {
    let list = this.families.filter(family => family.name === name);
    if (list.length == 0) return null;
    return list[0];
  }
}
