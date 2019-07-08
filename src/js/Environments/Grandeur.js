import { standardKit } from "../ShapesKits/standardKit"
import { Environment } from "./Environment"

/**
 * L'environnement "Grandeur".
 */
export class GrandeurEnvironment extends Environment {
    constructor() {
        super("Grandeur");

        this.loadFamilies(standardKit);
    }
}
