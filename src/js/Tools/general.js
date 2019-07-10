
/**
 * Calcule la moyene de 2 couleurs.
 * @param color1: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 * @param color2: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
export function getAverageColor(color1, color2) {
	var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
	if (!regex.test(color1) || !regex.test(color2)) {
		console.error("App.getAverageColor: une couleur n'a pas été reconnue: " + color1 + " " + color2);
		return;
	}
	if (color1.length == 4) //transforme #abc en #aabbcc
		color1 = '#' + color1[1] + '' + color1[1] + '' + color1[2] + '' + color1[2] + '' + color1[3] + '' + color1[3];
	if (color2.length == 4) //transforme #abc en #aabbcc
		color2 = '#' + color2[1] + '' + color2[1] + '' + color2[2] + '' + color2[2] + '' + color2[3] + '' + color2[3];
	color1 = color1.toUpperCase();
	color2 = color2.toUpperCase();

	var hexTodec = function (hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
		var conversion = {
			'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
			'8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
		};
		return conversion[hex[0]] * 16 + conversion[hex[1]];
	};
	var decToHex = function (dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
		var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
		return conversion[parseInt(dec / 16)] + conversion[dec % 16];
	}

	var red = parseInt((hexTodec(color1[1] + color1[2]) + hexTodec(color2[1] + color2[2])) / 2),
		green = parseInt((hexTodec(color1[3] + color1[4]) + hexTodec(color2[3] + color2[4])) / 2),
		blue = parseInt((hexTodec(color1[5] + color1[6]) + hexTodec(color2[5] + color2[6])) / 2);

	return '#' + decToHex(red) + decToHex(green) + decToHex(blue);
}

/**
 * Calcule la couleur complémentaire d'une couleur.
 * @param color: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
export function getComplementaryColor(color) {
    var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
    if (!regex.test(color)) {
        console.error("App.getComplementaryColor: la couleur n'a pas été reconnue: " + color);
        return;
    }
    if (color.length == 4) //transforme #abc en #aabbcc
        color = '#' + color[1] + '' + color[1] + '' + color[2] + '' + color[2] + '' + color[3] + '' + color[3];
    color = color.toUpperCase();

    var hexTodec = function (hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
        var conversion = {
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
            '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
        };
        return conversion[hex[0]] * 16 + conversion[hex[1]];
    };
    var decToHex = function (dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
        var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
            '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        return conversion[parseInt(dec / 16)] + conversion[dec % 16];
    }

    var red = 255 - hexTodec(color[1] + color[2]),
        green = 255 - hexTodec(color[3] + color[4]),
        blue = 255 - hexTodec(color[5] + color[6]);

    return '#' + decToHex(red) + decToHex(green) + decToHex(blue);
};

/**
 * Génère un identifiant unique (basé sur le timetamp actuel et Math.random())
 * @return {String} un identifiant unique
 */
export function uniqId() {
    var timestamp = new Date().getTime();
    var randInt = Math.floor(Math.random() * 1000 * 1000);
    var result = timestamp.toString(16) + randInt.toString(16);
    return result;
}
