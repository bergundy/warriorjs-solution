import { behavior, InternalState } from './behavior';
import { Warrior } from './types';

export class Player {
  protected state: InternalState;
  constructor() {
    this.state = {
      // turn: 0,
      coveredLeft: false,
      coveredRight: false,
      damageTaken: 0,
      heading: 'backward',
      orientation: 'forward',
    };
  }

  public playTurn(warrior: Warrior) {
    const state = { ...this.state, warrior };
    behavior(state);
    delete state.warrior;
    this.state = state;
    warrior.think('state', this.state);
  }

    // this.state = updateWarriorState(this.state, warrior)
    // warrior.think('orientation', this.state.orientation, 'heading', this.state.heading)
    // const heading = 'forward'
    // const space = warrior.feel(heading)
    // if (this.state.heading !== this.state.orientation) {
    //   this.state = pivot(this.state, warrior, this.state.heading)
    // } else if (hasMeleeTarget(warrior, 'forward')) {
    //   if (isSeverlyHurt(warrior) &&
    //     (hasMeleeTarget(warrior, 'backward') || (hasRangeTarget(warrior, 'backward') && )) {
    //       warrior.attack('forward')
    //   } else {
    //     warrior.walk('backward') // retreat
    //   }
    // }
  //   if (this.state.heading !== this.state.orientation) {
  //     this.state = pivot(this.state, warrior, this.state.heading)
  //   } else if (isHurt(warrior)) {
  //     if (isTakingDamage(this.state)) {
  //       if (isSeverlyHurt(warrior)) {
  //         warrior.walk(reverse(heading))
  //       } else if (hasMeleeTarget(warrior)) {
  //         warrior.attack(heading)
  //       } else {
  //         warrior.walk(heading)
  //       }
  //     } else {
  //       warrior.rest()
  //     }
  //   } else if (space.isEmpty()) {
  //     if (hasRangeTarget(warrior)) {
  //       warrior.shoot()
  //     } else {
  //       if (!space.isStairs() || this.state.coveredLeft && this.state.coveredRight) {
  //         warrior.walk(heading)
  //       } else {
  //         warrior.walk(reverse(heading))
  //       }
  //     }
  //   } else if (space.getUnit().isEnemy()) {
  //     warrior.attack(heading)
  //   } else if (space.getUnit().isBound()) {
  //     warrior.rescue(heading)
  //   }
	// }
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
