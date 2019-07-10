
export class Settings {
    constructor() {
        //Liste des paramètres (ne pas y accéder directement);
        this.data = {};
        //TODO trier ça. et exporter en un json?
        /**
         * Distance en dessous de laquelle 2 points se collent l'un à l'autre (quand on ajoute une forme par exemple)
         */
        this.add("magnetismDistance", 10, false);

        /**
         * La précision, en pixels. (2 points à moins de 'precision' pixels de distance sont considérés comme étant au même endroit )
         */
        this.add("precision", 1.5, false);

        //Niveau de zoom maximal de l'interface
        this.add("maxZoomLevel", 10, false);

        //Niveau de zoom minimal de l'interface
        this.add("minZoomLevel", 0.1, false);

        //TODO delete? n'est plus utilisé.
        this.add("isGridShown", false, true);
        this.add("gridSize", 1, true);
        this.add("gridType", 'square', true); //square ou triangle

        //Ajustement automatique des formes activé ?
        this.add("automaticAdjustment", true, true);

        //Pour l'opération diviser, défini en combien de partie un segment est divisé.
        this.add("divideStateNumberOfParts", 2, true); //TODO delete?

        //true si les formes ajoutées à l'avenir auront leurs sommets visibles
        this.add("areShapesPointed", true, true);

        //true si les formes ajoutées à l'avenir seront bifaces
        this.add("areShapesSided", false, true); //TODO delete?

        //opacité des formes qui seront ajoutées
        this.add("shapesOpacity", 0.7, true);  //TODO delete?

        //taille des formes qui seront ajoutées
        this.add("shapesSize", 2, true); //1,2,3
    }

    /**
     * Renvoie la valeur d'un paramètre
     * @param  {String} name le nom du paramètre
     * @return {Object}              sa valeur
     */
    get(name) {
        if (!this.data[name]) {
            console.log("Settings.get(): Le paramètre " + name + " n'existe pas.");
            return;
        }
        return this.data[name].value;
    };

    /**
     * AJoute un paramètre
     * @param  {String}  name       le nom du paramètre
     * @param  {Object}  value      la valeur
     * @param  {Boolean} isEditable true si la valeur du paramètre peut être modifiée par la suite.
     * @return {[type]}             [description]
     */
    add(name, value, isEditable) {
        if (this.data[name]) {
            console.log("Settings.add(): Le paramètre " + name + " existe déjà.");
            return;
        }
        this.data[name] = {
            'value': value,
            'isEditable': isEditable
        };
    };

    /**
     * Modifie la valeur d'un paramètre
     * @param  {String} name  le nom du paramètre
     * @param  {Object} value la nouvelle valeur
     */
    update(name, value) {
        if (!this.data[name]) {
            console.log("Settings.update(): Le paramètre " + name + " n'existe pas.");
            return;
        }
        if (!this.data[name].isEditable) {
            console.log("Settings.update(): Le paramètre " + name + " n'est pas éditable.");
            return;
        }
        this.data[name].value = value;
    }
}
