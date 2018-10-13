import { runtime } from './behaviortree';
import { behavior, InternalState } from './behavior';
import { Warrior } from './types';

export class Player {
  protected state: InternalState;
  constructor() {
    this.state = {
      coveredLeft: false,
      coveredRight: false,
      damageTaken: 0,
      heading: 'backward',
      orientation: 'forward',
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

//
// const updateWarriorState = ({
//   coveredLeft: prevCoveredLeft,
//   coveredRight: prevCoveredRight,
//   heading: prevHeading,
//   prevHealth,
//   orientation,
//   turn,
//   ...state
// }, warrior) => {
//   const coveredLeft = prevCoveredLeft || (orientation === 'forward'
//     ? warrior.feel('backward').isWall()
//     : warrior.feel('forward').isWall()
//   )
//   const coveredRight = prevCoveredRight || (orientation === 'forward'
//     ? warrior.feel('forward').isWall()
//     : warrior.feel('backward').isWall()
//   )
//   const heading = prevHeading === 'forward'
//     ? (coveredRight ? 'backward' : 'forward')
//     : (coveredLeft ? 'forward' : 'backward')
//   return {
//     ...state,
//     orientation,
//     coveredLeft,
//     coveredRight,
//     heading,
//     damageTaken: (prevHealth || warrior.maxHealth()) - warrior.health(),
//     prevHealth: warrior.health(),
//   }
// }
//
// const pivot = ({ orientation, ...state }, warrior, direction) => {
//   warrior.pivot(direction)
//   return {
//     ...state,
//     orientation: direction
//   }
// }
//
