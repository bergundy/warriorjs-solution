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
  nextDirection,
} from './types';

import {
  sum,
  zip,
} from './lib';

export interface InternalState {
  prevHealth?: number;
  damageTaken: number;
  possibleRangeDirection?: Direction;
  orientation: Orientation;
  heading: Direction;
  seen: Space[];
  threats: Map<Direction, boolean>;
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

function bind({ warrior }: State) {
  // Prefer not to bind forward
  const direction = [...ALL_DIRECTIONS].reverse().find((dir) =>
    hasMeleeTarget(warrior, dir)
    && !warrior.feel(dir).getUnit()!.isBound()
  );
  if (direction) {
    warrior.bind(direction!);
    return true;
  }
  return false;
}

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

const walk = succeeder('walk', ({ warrior, heading }: State) => warrior.walk(heading));

function trackExplorationProgress(state: State) {
  const { warrior, orientation } = state;
}
const hasTickingCaptive = (space: Space) => space.isUnit() && space.getUnit()!.isUnderEffect('ticking');

function compareUnitSpaces(sp1: Space, sp2: Space) {
  const priority1 = 1 - Number(hasTickingCaptive(sp1));
  const priority2 = 1 - Number(hasTickingCaptive(sp2));
  return priority1 - priority2;
}

function updateHeading(state: State) {
  const { warrior } = state;
  const spacesWithUnits = warrior.listen().sort(compareUnitSpaces);
  if (spacesWithUnits.length > 0) {
    const space = spacesWithUnits[0];
    const direction = warrior.directionOf(space);
    if (!warrior.feel(direction).isStairs() && (!hasTickingCaptive(space) || warrior.feel(direction).isEmpty())) {
      state.heading = direction;
    } else {
      let dir = direction;
      do {
        dir = nextDirection(dir);
        if (warrior.feel(dir).isEmpty()) {
          state.heading = dir;
          break;
        }
      } while (dir !== direction);
    }
  } else {
    state.heading = warrior.directionOfStairs();
  }
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
  state.threats = new Map(zip(
    ALL_DIRECTIONS,
    ALL_DIRECTIONS
    .map((dir) => warrior.feel(dir))
    .map((space) => space.getUnit())
    .map((unit) => unit !== undefined && unit.isEnemy() && !unit.isBound())
  ));
}

export const updateState = sequence(
  succeeder('trackDamageTaken', trackDamageTaken),
  succeeder('trackExplorationProgress', trackExplorationProgress),
  succeeder('trackThreatLevel', trackThreatLevel)
);

export const threatLevel = ({ threats }: State) => sum(...threats.values());

export const threatLevelHigh = condition('threatLevelHigh', (state: State) => threatLevel(state) >= 2);

const combat = selector(
  // sequence(
  //   isSeverlyHurt,
  //   condition('retreat', retreat)
  // ),
  sequence(
    hasMeleeTargetAround,
    succeeder('meleeAttack', meleeAttack)
  )
  // ),
  // sequence(
  //   hasPossibleRangeTarget,
  //   rangeAttack
);

const rest = sequence(
  inverter(condition('threatened', (state: State) => threatLevel(state) > 0)),
  condition('needsRest', ({ warrior }: State) => isHurt(warrior)),
  condition('enemiesLeft', ({ warrior }: State) => warrior.listen()
    .filter((s) => s.isUnit() && s.getUnit()!.isEnemy())
    .length > 0),
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

export const behavior = sequence(
  updateState,
  selector(
    sequence(
      condition('hasTickingCaptives', ({ warrior }: State) => warrior.listen().find(hasTickingCaptive) !== undefined),
      selector(
        rescue,
        explore
      )
    ),
    sequence(
      threatLevelHigh,
      condition('bind', bind)
    ),
    //   inverter(isSurrounded),
    //   condition('retreat', retreat)
    // ),
    rest,
    combat,
    rescue,
    explore
  )
);
