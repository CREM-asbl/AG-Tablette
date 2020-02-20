import { app } from '../App';

import { MoveState } from '../States/Move.js';
import { MoveAction } from '../States/Actions/Move';

import { RotateState } from '../States/Rotate.js';
import { RotateAction } from '../States/Actions/Rotate';

import { ReverseState } from '../States/Reverse.js';
import { ReverseAction } from '../States/Actions/Reverse';

import { PermanentZoomPlaneState } from '../States/PermanentZoomPlane';

new MoveState();
new MoveAction();

new RotateState();
new RotateAction();

new ReverseState();
new ReverseAction();

app.permanentStates = {
  name: 'Zoom permanent',
};
new PermanentZoomPlaneState();
