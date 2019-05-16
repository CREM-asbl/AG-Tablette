

export class Settings {
    constructor() {
        //Liste des paramètres (ne pas y accéder directement);
        this.data = {};

        /**
         * Distance en dessous de laquelle 2 points se collent l'un à l'autre (quand on ajoute une forme par exemple)
         */
        this.add("magnetismDistance", 10, false);

        /**
         * La précision, en pixels. (2 poitns à moins de 'precision' pixels de distance sont considérés comme étant au même endroit )
         */
        this.add("precision", 1.5, false);

        //Niveau de zoom maximal de l'interface
        this.add("maxZoomLevel", 10, false);

        //Niveau de zoom minimal de l'interface
        this.add("minZoomLevel", 0.01, false);

        /**
         * Paramètres d'affichage de la grille.
         * Le point de référence de la grille est le point (10,10).
         * Si grille carrée: le côté du carré est de 50 unités. (-> ex de points: (60, 60), (60,10), (10,60), ...)
         * Si grille triangulaire: la base du triangle est de 50 unités, et le triangle est équilatéral.
         * 		(-> Ex de points: (-15, 52.5), (35, 52.5), (60, 10), ...)
         */
        this.add("isGridShown", false, true);
        this.add("gridSize", 1, true);
        this.add("gridType", 'square', true); //square ou triangle

        //Ajustement automatique des formes activé ?
        this.add("automaticAdjustment", true, true);

        //Pour l'opération diviser, défini en combien de partie un segment est divisé.
        this.add("divideStateNumberOfParts", 2, true);

        //true si les formes ajoutées à l'avenir auront leurs sommets visibles
        this.add("areShapesPointed", true, true);

        //true si les formes ajoutées à l'avenir seront bifaces
        this.add("areShapesSided", false, true);

        //opacité des formes qui seront ajoutées
        this.add("shapesOpacity", 0.7, true); //0, 0.7, 1

        //taille des formes qui seront ajoutées
        this.add("shapesSize", 2, true); //1,2,3

        this.add("virtualMouseSize", 1.5, false);
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