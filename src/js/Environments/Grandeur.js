import { standardKit } from "../ShapesKits/standardKit"
import { Environment } from "./Environment"
import { Family } from '../Objects/Family'
import { Segment, Vertex, MoveTo } from '../Objects/ShapeBuildStep'

/**
 * L'environnement "Grandeur".
 */
export class GrandeurEnvironment extends Environment {
    constructor() {
        super("Grandeur");

        this.loadFamilies(standardKit);
    }
}
