import { CreateState } from './States/Create.js' //TODO: pourquoi cela ne fonctionne pas sans le ".js" ?
import { MoveState } from './States/Move.js'



export class StatesManager {
    static states = {
        'create_shape': {
            "name": 'Ajouter une forme',
            "instance": null,
            "getInstance": function() { return new CreateState(); }
        },
        'move_shape': {
            "name": 'Glisser',
            "instance": null,
            "getInstance": function() { return new MoveState(); }
        },
        'rotate_shape': {
            "name": 'Tourner',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'global_zoom': {
            "name": 'Zoom',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'delete_shape': {
            "name": 'Supprimer',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'background_color': {
            "name": 'Couleur de fond',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'border_color': {
            "name": 'Couleur des bords',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'link_shapes': {
            "name": 'Lier des formes',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'unlink_shapes': {
            "name": 'Délier des formes',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'reverse_shape': {
            "name": 'Retourner',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'build_shape_center': {
            "name": 'Construire le centre',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'duplicate_shape': {
            "name": 'Dupliquer',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'divide_segment': {
            "name": 'Diviser',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'merge_shapes': {
            "name": 'Fusionner',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'cut_shape': {
            "name": 'Découper',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'moveplane_state': {
            "name": 'Glisser le plan',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
    }

    static getStateInstance(stateName) {
        if(!this.states[stateName]) {
            console.error("This state does not exists");
            return null;
        }
        if(!this.states[stateName].instance)
            this.states[stateName].instance = this.states[stateName].getInstance();
        return this.states[stateName].instance;
    }

    static getStateText(stateName) {
        if(!this.states[stateName]) {
            console.error("This state does not exists");
            return null;
        }
        return this.states[stateName].name;
    }
}
