import '../App';

import { MoveState } from '../../Move/MoveState';
import { MoveAction } from '../../Move/MoveAction';

import { RotateState } from '../../Rotate/RotateState';
import { RotateAction } from '../../Rotate/RotateAction';

import { ReverseState } from '../../Reverse/ReverseState';
import { ReverseAction } from '../../Reverse/ReverseAction';

new MoveState();
new MoveAction();

new RotateState();
new RotateAction();

new ReverseState();
new ReverseAction();
