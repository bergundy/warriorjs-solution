import { runtime } from './behaviortree';
import { behavior, InternalState } from './behavior';
import { Warrior } from './types';

export class Player {
  protected state: InternalState;
  constructor() {
    this.state = {
      damageTaken: 0,
      threats: new Map(),
      heading: 'backward',
      orientation: 'right',
      seen: [],
    };
  }

  public playTurn(warrior: Warrior) {
    const state = { ...this.state, warrior };
    // runtime.log = warrior.think.bind(warrior);
    // warrior.think('state', this.state);

    behavior(state);
    delete state.warrior;
    this.state = state;
  }
}
