import { app } from '../App';

import { MoveState } from '../States/Move.js';
import { RotateState } from '../States/Rotate.js';
import { ReverseState } from '../States/Reverse.js';
import { PermanentZoomPlaneState } from '../States/PermanentZoomPlane';
import { MoveAction } from '../States/Actions/Move';
import { RotateAction } from '../States/Actions/Rotate';
import { ReverseAction } from '../States/Actions/Reverse';

app.states = {
  move_shape: {
    name: 'Glisser',
  },
  rotate_shape: {
    name: 'Tourner',
  },
  reverse_shape: {
    name: 'Retourner',
  },
};
new MoveState();
new RotateState();
new ReverseState();

app.actions = {
  MoveAction: {
    name: 'MoveAction',
  },
  ReverseAction: {
    name: 'ReverseAction',
  },
  RotateAction: {
    name: 'RotateAction',
  },
};
new MoveAction();
new RotateAction();
new ReverseAction();

app.permanentStates = {
  name: 'Zoom permanent',
};
new PermanentZoomPlaneState();
