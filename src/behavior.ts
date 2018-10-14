import {
  condition,
  inverter,
  selector,
  sequence,
  succeeder,
} from './behaviortree';

import {
  Direction,
  Orientation,
  Warrior,
  Unit,
  Space,
  ALL_DIRECTIONS,
  relativeOrientation,
} from './types';

import {
  sum,
} from './lib';

export interface InternalState {
  prevHealth?: number;
  damageTaken: number;
  possibleRangeDirection?: Direction;
  orientation: Orientation;
  heading: Direction;
  seen: Space[];
  threatLevel: number;
}

export type State = InternalState & {
  warrior: Warrior;
};

const healthPercent = (warrior: Warrior) => warrior.health() / warrior.maxHealth();
const isHurt = (warrior: Warrior) => healthPercent(warrior) < 1;
const isEnemy = (space?: Space) => space && space.getUnit() ? space.getUnit()!.isEnemy() : false;
const isBound = (space?: Space) => space && space.getUnit() ? space.getUnit()!.isBound() : false;
const reverse = (direction: Direction) => direction === 'forward' ? 'backward' : 'forward';
const nextUnit = (warrior: Warrior, direction: Direction) => warrior.look(direction).find((space) => space.isUnit());

const hasMeleeTarget = (warrior: Warrior, direction: Direction) => isEnemy(warrior.feel(direction));
const hasRangeTarget = (warrior: Warrior, direction: Direction) => isEnemy(nextUnit(warrior, direction));

const hasMeleeTargetAround = condition(
  'hasMeleeTargetAround',
  ({ warrior }: State) => ALL_DIRECTIONS.find((dir) => hasMeleeTarget(warrior, dir)) !== undefined);

// function hasPossibleRangeTarget(state: State) {
//   const { warrior } = state;
//   for (const direction of ALL_DIRECTIONS.reverse()) { // TODO: don't reverse
//     if (hasRangeTarget(warrior, direction)) {
//       state.possibleRangeDirection = direction;
//       return SUCCESS;
//     }
//   }
//   delete state.possibleRangeDirection;
//   return FAILURE;
// }
//
const isSeverlyHurt = condition('isSeverlyHurt', ({ warrior }: State) => healthPercent(warrior) < 0.5);

function meleeAttack({ warrior }: State) {
  const direction = ALL_DIRECTIONS.find((dir) => hasMeleeTarget(warrior, dir));
  warrior.attack(direction!);
}

// function rangeAttack({ warrior, possibleRangeDirection }: State) {
//   warrior.shoot(possibleRangeDirection!);
// }

function trackDamageTaken(state: State) {
  const { prevHealth, warrior } = state;
  state.damageTaken = (prevHealth || warrior.maxHealth()) - warrior.health();
  state.prevHealth = warrior.health();
}

const isTakingDamage = condition('isTakingDamage', ({ damageTaken }: State) => damageTaken > 0);

const canWalk = condition('canWalk', ({ warrior, heading }: State) =>
  warrior.feel(heading).isEmpty() || warrior.feel(heading).isStairs());

const walk = succeeder('walk', ({ warrior, heading }) => warrior.walk(heading));

// const canWalk = condition('canWalk', ({ warrior }: State) =>
//   warrior.feel('forward').isEmpty() || warrior.feel('forward').isStairs());
//
// const walk = succeeder('walk', ({ warrior }) => warrior.walk('forward'));

function trackExplorationProgress(state: State) {
  const { warrior, orientation } = state;
}

function updateHeading(state: State) {
  const { warrior } = state;
  state.heading = warrior.directionOfStairs();
}

function pivot(state: State) {
  state.warrior.pivot(state.heading);
  state.orientation = relativeOrientation(state.orientation, state.heading);
}

const isOrientented = condition('isOriented', ({ heading, orientation }: State) => heading === orientation);

const isSurrounded = condition('isSurrounded', ({ warrior }: State) =>
  ALL_DIRECTIONS.find((dir) => warrior.feel(dir).isEmpty()) !== undefined);

function retreat({ warrior }: State) {
  const direction = ALL_DIRECTIONS.find((dir) => warrior.feel(dir).isEmpty());
  if (direction !== undefined) {
    warrior.walk(direction);
    return true;
  }
  return false;
}

function trackThreatLevel(state: State) {
  const { warrior } = state;
  state.threatLevel = sum(ALL_DIRECTIONS.map((dir) => isEnemy(warrior.feel(dir)) ? 1 : 0));
}

const combat = selector(
  sequence(
    isSeverlyHurt,
    condition('retreat', retreat)
  ),
  sequence(
    hasMeleeTargetAround,
    succeeder('meleeAttack', meleeAttack)
  // ),
  // sequence(
  //   hasPossibleRangeTarget,
  //   rangeAttack
  )
);

const rest = sequence(
  inverter(condition('threatened', ({ threatLevel }: State) => threatLevel > 0)),
  condition('needsRest', ({ warrior }: State) => isHurt(warrior)),
  succeeder('rest', ({ warrior }: State) => warrior.rest())
);

const rescue = sequence(
  condition(
    'canRescue',
    ({ warrior }: State) => ALL_DIRECTIONS.find((dir) => isBound(warrior.feel(dir))) !== undefined),
  succeeder('rescue', ({ warrior }: State) => {
    const direction = ALL_DIRECTIONS.find((dir) => isBound(warrior.feel(dir)));
    warrior.rescue(direction!);
  })
);

const explore = sequence(
  sequence(
    succeeder('updateHeading', updateHeading),
    selector(
      // sequence(
      //   inverter(isOrientented),
      //   succeeder(pivot)
      // ),
      sequence(
        canWalk,
        walk
      )
    )
  )
);

export const updateState = sequence(
  succeeder('trackDamageTaken', trackDamageTaken),
  succeeder('trackExplorationProgress', trackExplorationProgress),
  succeeder('trackThreatLevel', trackThreatLevel)
);

export const threatLevelHigh = condition(
  'threatLevelHigh', ({ threatLevel }) => threatLevel >= 2);

export const behavior = sequence(
  updateState,
  selector(
    sequence(
      threatLevelHigh,
      inverter(isSurrounded),
      condition('retreat', retreat)
    ),
    rescue,
    rest,
    combat,
    explore
  )
);
