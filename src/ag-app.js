import { app, setState } from './Core/App';
import './Core/Manifest';
import { LitElement, html } from 'lit';
import './auto-launch';
import './backbutton-manager';
import { openFileFromId } from './Firebase/firebase-init';
// import { uniqId } from './Core/Tools/general';
import { loadEnvironnement } from './Core/Environments/Environment';
// import { Shape } from './Core/Objects/Shape';
import { Coordinates } from './Core/Objects/Coordinates';
import { downloadZip } from "https://cdn.jsdelivr.net/npm/client-zip/index.js"

class AgApp extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
      appLoading: { type: Boolean },
    };
  }

  constructor() {
    super();

    this.appLoading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setState();
    window.addEventListener('state-changed', () => this.setState());
    this.parseURL();
  }

  parseURL() {
    let parsedUrl = new URL(window.location.href);
    let part = parsedUrl.searchParams.get("interface");
    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      this.openEnv(part);
      return;
    }
    let activityId = parsedUrl.searchParams.get("activityId");
    if (activityId)
      openFileFromId(activityId);
    let generateSVGs = parsedUrl.searchParams.get("generateSVGs");
    if (generateSVGs)
      AgApp.generateSVGs(generateSVGs);
      // openFileFromId(activityId);
  }

  render() {
    let toRender = [];
    if (this.appLoading) {
      import('./loading-elem');
      toRender.push(html`<loading-elem></loading-elem>`);
    }
    if (this.environnement_selected) {
      history.pushState({}, "main page");
      const AGmainLoader = import('./ag-main');
      toRender.push( html`<ag-main></ag-main>`);
    } else if (!this.appLoading) {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    }
    return toRender;
  }

  async openEnv(e) {
    if (app?.short_name == "AG mobile" && e != "Grandeurs")
      return;
    setState({ appLoading: true });
    setState({ environment: await loadEnvironnement(e) });
  }

  setState() {
    if (app.appLoading) {
      this.appLoading = true;
    }
    this.environnement_selected = app.environment !== undefined;
  }

  static async computeFile(shapeTemplate) {
    const shapeImport = await import('./Core/Objects/Shape');
    let canvasSize = 52;
    let shape =
      new shapeImport.Shape({
        ...shapeTemplate,
        drawingEnvironment: app.invisibleDrawingEnvironment,
        opacity: 1,
      });

    let scale, center;
    if (shape.isCircle()) {
      scale = 0.42 * canvasSize / 52; // arbitraire
      center = shape.segments[0].arcCenter.coordinates;
    } else {
      // let shapeBounds = this.shapes.map((s) => s.bounds);
      let totalBounds = shape.bounds;
      const largeur = totalBounds.maxX - totalBounds.minX,
        hauteur = totalBounds.maxY - totalBounds.minY;
      scale = 40 * canvasSize / 52 / Math.max(largeur, hauteur);
      center = new Coordinates({
        x: (totalBounds.minX + largeur / 2) * scale,
        y: (totalBounds.minY + hauteur / 2) * scale,
      });
    }

    const centerOffset = new Coordinates({
      x: canvasSize / 2 - center.x,
      y: canvasSize / 2 - center.y,
    });

    let path = shapeTemplate.path;
    if (path[0] != 'M') {
      path = 'M 0 0 ' + path;
    }

    let regexes = [
      /([\" \n]?[ML]) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*)/g,
      /([\" \n][A]) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*)/g,
      /([\" \n][H]) (-?[0-9]+\.?[0-9]*)/g,
      /([\" \n][V]) (-?[0-9]+\.?[0-9]*)/g,
    ];
    let replaces = [
      (match) => [match[1], match[2] * scale + centerOffset.x, match[3] * scale + centerOffset.y].join(' '),
      (match) => [match[1], match[2] * scale, match[3] * scale, match[4], match[5], match[6], match[7] * scale + centerOffset.x, match[8] * scale + centerOffset.y].join(' '),
      (match) => [match[1], match[2] * scale + centerOffset.x].join(' '),
      (match) => [match[1], match[2] * scale + centerOffset.y].join(' '),
    ];
    for (let i = 0; i < 4; i++) {
      let matches = path.matchAll(regexes[i]);
      matches = [...matches];
      matches.sort((idx1, idx2) => idx2.index - idx1.index);
      matches.forEach(match => {
        path = path.slice(0, match.index) +
          replaces[i](match) +
          path.slice(match.index + match[0].length);
      });
    }

    let filecontent = `<?xml version="1.0" encoding="utf-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 52 52" width="52px" height="52px" xml:space="preserve">
    <style type="text/css">
            path {
        fill:${shapeTemplate.color};
        stroke:#000;
        stroke-width:1;
        stroke-miterlimit:10;
      }
    </style>
    <path class="st0" d="${path}"/>
    </svg>`

    const file = { name: shapeTemplate.name.replaceAll('é', 'e').replaceAll('è', 'e') + ".svg", lastModified: new Date(), input: filecontent };
    return file;
  }

  static async generateSVGs(e) {
    setState({ appLoading: true });
    setState({ environment: await loadEnvironnement(e) });

    await new Promise(resolve => setTimeout(resolve, 1000));

    let files = [];

    app.environment.families.forEach(family => {
      family.shapeTemplates.forEach(shapeTemplate => {
        files = [...files, AgApp.computeFile(shapeTemplate)];
      })
    })

    AgApp.downloadTestZip(files);
  }

  static async downloadTestZip(files) {
    // get the ZIP stream in a Blob
    const blob = await downloadZip(files).blob()

    // make and click a temporary link to download the Blob
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "Icones " + app.environment.name + ".zip";
    link.click()
    link.remove()

    // in real life, don't forget to revoke your Blob URLs if you use them
  }
}
customElements.define('ag-app', AgApp);
