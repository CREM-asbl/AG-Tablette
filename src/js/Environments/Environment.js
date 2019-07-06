/**
 * Environnement de travail: Grandeur, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
    constructor(name) {
        if(this.constructor === Environment) {
            throw new TypeError('Abstract class "Environment" cannot be instantiated directly');
        }

        //Nom de l'environnement
        this.name = name;

        //Liste des familles de formes disponibles dans cet environnement
        this.families = [];

        //TODO: outils activés/désactivés, etc.
    }

    /**
     * Charger les familles de l'environnement à partir d'un kit
     * @param  {Data} kit données du kit à charger
     */
    loadFamilies(kit) {
        for(let familyName of Object.keys(kit)) {
            let familyData = kit[familyName];
            let family = new Family(familyName, familyData.defaultColor);
            familyData.shapes.forEach(shape => {
    			const buildSteps = shape.steps.map(step => {
    				const { type, x, y, isArc = false } = step;
                    if(type == "moveTo") return new MoveTo({x, y});
                    if(type == "vertex") return new Vertex({x, y});
                    if(type == "segment") return new Segment({x, y}, isArc);
                    console.error("No valid type");
                    return null;
    			});
    			family.addShape(shape.name, buildSteps, shape.refPoint);
    		});
            this.families.push(family);
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
        if(list.length==0) return null;
        return list[0];
	}
}
