import { State } from '../State'

export class Action {
    constructor() {
        if(this.constructor === State) {
            throw new TypeError('Abstract class "Action" cannot be instantiated directly');
        }
    }

    saveToObject() {
        throw new TypeError("method not implemented");
    }

    initFromObject(save) {
        throw new TypeError("method not implemented");
    }


    checkDoParameters() {
        throw new TypeError("method not implemented");
    }

    checkUndoParameters() {
        throw new TypeError("method not implemented");
    }

    do() {
        throw new TypeError("method not implemented");
    }

    undo() {
        throw new TypeError("method not implemented");
    }
}
