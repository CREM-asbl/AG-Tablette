/**
 * Calcule la moyene de x couleurs.
 * @param {String} colors couleurs (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
export function getAverageColor(...colors) {
  let regex = /^#([0-9a-fA-F]{3}){1,2}$/,
    arglen = colors.length;
  for (let i = 0; i < arglen; i++) {
    if (!regex.test(colors[i])) {
      console.error("getAverageColor: une couleur n'a pas été reconnue: " + colors[i]);
    }
  }
  let usableColors = colors.map(color => {
    if (color.length == 4) {
      return ('#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]).toUpperCase();
    } else {
      return color.toUpperCase();
    }
  });

  let red = 0,
    green = 0,
    blue = 0;
  usableColors.forEach(color => {
    red += parseInt(color[1] + color[2], 16);
    green += parseInt(color[3] + color[4], 16);
    blue += parseInt(color[5] + color[6], 16);
  });

  red = Math.floor(red / usableColors.length);
  green = Math.floor(green / usableColors.length);
  blue = Math.floor(blue / usableColors.length);

  return (
    '#' +
    red.toString(16).padStart(2, '0') +
    green.toString(16).padStart(2, '0') +
    blue.toString(16).padStart(2, '0')
  );
}

/**
 * Calcule la couleur complémentaire d'une couleur.
 * @param color: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
export function getComplementaryColor(color) {
  let regex = /^#([0-9a-fA-F]{3}){1,2}$/;
  if (!regex.test(color)) {
    console.error("App.getComplementaryColor: la couleur n'a pas été reconnue: " + color);
    return;
  }
  if (color.length == 4)
    //transforme #abc en #aabbcc
    color =
      '#' +
      color[1] +
      '' +
      color[1] +
      '' +
      color[2] +
      '' +
      color[2] +
      '' +
      color[3] +
      '' +
      color[3];
  color = color.toUpperCase();

  let hexTodec = function(hex) {
    //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
    let conversion = {
      '0': 0,
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
    };
    return conversion[hex[0]] * 16 + conversion[hex[1]];
  };
  let decToHex = function(dec) {
    //transforme un nombre décimal de 0 à 255 en hexadécimal
    let conversion = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
    ];
    return conversion[parseInt(dec / 16)] + conversion[dec % 16];
  };

  let red = 255 - hexTodec(color[1] + color[2]),
    green = 255 - hexTodec(color[3] + color[4]),
    blue = 255 - hexTodec(color[5] + color[6]);

  return '#' + decToHex(red) + decToHex(green) + decToHex(blue);
}

/**
 * Génère un identifiant unique (basé sur le timetamp actuel et Math.random())
 * @return {String} un identifiant unique
 */
export function uniqId() {
  let timestamp = new Date().getTime();
  let randInt = Math.floor(Math.random() * 1000 * 1000);
  let result = timestamp.toString(16) + randInt.toString(16);
  return result;
}

/**
 * Fonction modulo (renvoie valeur positive, contrairement à % dans certains cas)
 * @param  {[type]} x [description]
 * @param  {[type]} n [description]
 * @return {[type]}   [description]
 */
export function mod(x, n) {
  return ((x % n) + n) % n;
}

export function printCoord(msg, coord) {
  console.log(msg + ' ', parseInt(coord.x * 1000) / 1000, parseInt(coord.y * 1000) / 1000);
}

/**
 * create an element and add it to document
 * @param {String} name  name of the element to create
 */
export function createElem(name) {
  const elem = document.createElement(name);
  elem.style.display = 'block';
  document.querySelector('body').appendChild(elem);
  return elem;
}