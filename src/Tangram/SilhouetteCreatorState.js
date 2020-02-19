import { app } from '../js/App';
import { State } from '../js/States/State';
import { Tangram } from './Tangram';
import { Point } from '../js/Objects/Point';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorState extends State {
  constructor() {
    super('silhouette-creator', 'Créer Tangram', 'tool');

    // selecting-polygons -> selecting-shapes
    this.currentStep = null;

    this.subStep = null;

    this.constr = null;

    this.polygons = null;

    this.shapes = [];

    this.buttons = null;

    // withInternalSegment or neInternalSegment
    this.silhouetteMode = 'noInternalSegment';

    window.addEventListener('new-window', () => this.finish());

    window.addEventListener('app-state-changed', () => app.state == 'tangram' && this.finish());
  }

  /**
   * initialiser l'état
   */
  start() {
    app.workspace.shapes = [];
    app.tangram.silhouette = null;
    TangramManager.showShapes();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape;

    this.buttons = [
      {
        text: 'Créer silhouette',
        value: 'end',
      },
      // {
      //   text: 'Supprimer le dernier polygone',
      //   value: 'delete_last_polygon',
      // },
      // {
      //   text: 'Télécharger le tangram',
      //   value: 'end_shapes',
      // },
    ];

    this.showStateMenu();
    addEventListener('state-menu-button-click', e => this.clickOnStateMenuButton(e.detail));

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  restart() {
    app.workspace.shapes = [];
    TangramManager.showShapes();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape;
  }

  finish() {
    window.dispatchEvent(new CustomEvent('close-state-menu'));
    // document.querySelector('state-menu').remove();
    TangramManager.hideShapes();
  }

  end() {
    // document.querySelector('state-menu').remove();
    // TangramManager.hideShapes();
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Créateur de silhouettes';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
              Pour créer une nouvelle silhouette, disposez les formes comme vous les désirez, <br />
              en veillant à ce que toutes les formes soient reliées par au moins un segment. <br />
              Cliquez sur le bouton FIN une fois que vous avez terminé. <br />
            </p>
      `;
  }

  clickOnStateMenuButton(btn_value) {
    if (btn_value == 'end') {
      let silhouette = TangramManager.createSilhouette(app.workspace.shapes, this.silhouetteMode);
      app.tangram.silhouette = silhouette;

      window.dispatchEvent(new CustomEvent('refreshBackground'));
    }
  }

  showStateMenu() {
    if (document.querySelector('state-menu')) return;
    import('./state-menu');
    const menu = document.createElement('state-menu');
    menu.buttons = this.buttons;
    document.querySelector('body').appendChild(menu);
  }

  createAndSaveTangram(name) {
    let shapes = this.shapes.map(s => s.copy()),
      polygons = this.polygons.map(pol => {
        return pol.map(pt => new Point(pt));
      }),
      tangram = new Tangram(name, shapes, polygons);
    app.tangramManager.addLocalTangram(tangram);

    let json = JSON.stringify(tangram.saveToObject());
    const file = new Blob([json], { type: 'application/json' });
    const downloader = document.createElement('a');
    downloader.href = window.URL.createObjectURL(file);
    downloader.download = name + '.json';
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  selectNextPolygonPoint(object) {
    if (this.subStep == 'new-polygon') {
      this.polygons.push([object.coordinates]);
      this.subStep = 'next-point';
    } else {
      let last_polygon = this.polygons[this.polygons.length - 1],
        p1 = object.coordinates,
        first_point = last_polygon[0],
        last_point = last_polygon[last_polygon.length - 1];
      if (p1.equal(first_point)) {
        //On a recliqué sur le 1e point
        if (last_polygon.length == 1) {
          this.polygons.pop(); //annuler la sélection du 1er point
        } else if (last_polygon.length > 2) {
          //On a fait le tour du polygone
          this.subStep = 'new-polygon';
          last_polygon.push(object.coordinates);
        }
        //si ==2: ne rien faire.
      } else {
        if (p1.equal(last_point)) {
          //annuler le dernier point
          last_polygon.pop();
        } else {
          /*
                    Si on clique sur un point qui est déjà dans le tableau, mais qui
                    n'est ni le premier ni le dernier, on l'ajoute quand même une
                    seconde fois. Et s'il n'y est pas encore, on l'ajoute aussi.
                     */
          last_polygon.push(object.coordinates);
        }
      }
    }
  }

  selectNextShape(object) {
    let i = this.shapes.findIndex(s => s.id == object.id);
    if (i != -1) {
      this.shapes.splice(i, 1);
    } else {
      this.shapes.push(object);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep == 'selecting-polygons') {
      this.selectNextPolygonPoint(object);
    } else if (this.currentStep == 'selecting-shapes') {
      this.selectNextShape(object);
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw() {
    // this.polygons.forEach(polygon => {
    //   app.app.drawPoint(Ctx, polygon[0], '#E90CC8', 1);
    //   for (let i = 0; i < polygon.length - 1; i++) {
    //     app.app.drawLine(Ctx, polygon[i], polygon[i + 1], '#E90CC8', 3);
    //     app.app.drawPoint(Ctx, polygon[i + 1], '#E90CC8', 1);
    //   }
    // });
    // if (this.currentStep == 'selecting-polygons') return;
    // this.shapes.forEach(shape => {
    //   let color = shape.color,
    //     borderColor = shape.borderColor;
    //   shape.color = '#E90CC8';
    //   shape.borderColor = '#E90CC8';
    //   window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: shape } }));
    //   shape.color = color;
    //   shape.borderColor = borderColor;
    // });
  }

  // setSelConstraints() {
  //   this.constr.eventType = 'click';

  //   if (this.currentStep == 'selecting-polygons') {
  //     this.constr.shapes.canSelect = false;
  //     this.constr.points.canSelect = true;
  //     this.constr.points.types = ['vertex', 'segmentPoint', 'center'];
  //     this.constr.points.whitelist = null;
  //     this.constr.points.blacklist = null;
  //   } else if (this.currentStep == 'selecting-shapes') {
  //     this.constr.points.canSelect = false;
  //     this.constr.shapes.canSelect = true;

  //     this.constr.shapes.whitelist = null;
  //     this.constr.shapes.blacklist = null;
  //   }
  //   app.workspace.selectionConstraints = this.constr;
  // }
}
