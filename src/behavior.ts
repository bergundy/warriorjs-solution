import {
  FAILURE,
  RUNNING,
  SUCCESS,
  condition,
  inverter,
  selector,
  sequence,
  succeeder,
} from './behaviortree';

import {
  Direction,
  Warrior,
  Unit,
  Space,
  ALL_DIRECTIONS,
} from './types';

export interface InternalState {
  prevHealth?: number;
  damageTaken: number;
  possibleRangeDirection?: Direction;
  orientation: Direction;
  heading: Direction;
  coveredLeft: boolean;
  coveredRight: boolean;
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

const hasMeleeTarget = (warrior: Warrior, direction: Direction) => isEnemy(warrior.feel('backward'));
const hasRangeTarget = (warrior: Warrior, direction: Direction) => isEnemy(nextUnit(warrior, direction));

function hasMeleeTargetInFront({ warrior }: State) {
  if (hasMeleeTarget(warrior, 'forward')) {
    return SUCCESS;
  } else {
    return FAILURE;
  }
}

function hasPossibleRangeTarget(state: State) {
  const { warrior } = state;
  for (const direction of ALL_DIRECTIONS.reverse()) { // TODO: don't reverse
    if (hasRangeTarget(warrior, direction)) {
      state.possibleRangeDirection = direction;
      return SUCCESS;
    }
  }
  delete state.possibleRangeDirection;
  return FAILURE;
}

const isSeverlyHurt = condition(({ warrior }: State) => healthPercent(warrior) < 0.5);

function meleeAttack({ warrior }: State) {
  warrior.attack('forward');
  return SUCCESS;
}

function rangeAttack({ warrior, possibleRangeDirection }: State) {
  warrior.shoot(possibleRangeDirection!);
  return SUCCESS;
}

function trackDamageTaken(state: State) {
  const { prevHealth, warrior } = state;
  state.damageTaken = (prevHealth || warrior.maxHealth()) - warrior.health();
  state.prevHealth = warrior.health();
  return SUCCESS;
}

const isTakingDamage = condition(({ damageTaken }: State) => damageTaken > 0);

const canWalk = condition(({ warrior, orientation }: State) => warrior.feel(orientation).isEmpty());

const walk = succeeder(({ warrior, orientation }) => warrior.walk(orientation));

function trackExplorationProgress(state: State) {
  const { warrior, orientation } = state;
  state.coveredLeft = state.coveredLeft || (orientation === 'forward'
    ? warrior.feel('backward').isWall()
    : warrior.feel('forward').isWall()
  );
  state.coveredRight = state.coveredRight || (orientation === 'forward'
    ? warrior.feel('forward').isWall()
    : warrior.feel('backward').isWall()
  );
  return SUCCESS;
}

function updateHeading(state: State) {
  state.heading = state.heading === 'forward'
    ? (state.coveredRight ? 'backward' : 'forward')
    : (state.coveredLeft ? 'forward' : 'backward');
  return SUCCESS;
}

function pivot(state: State) {
  state.warrior.pivot(state.heading);
  state.orientation = state.heading;
  return SUCCESS;
}

const isOrientented = condition(({ heading, orientation }: State) => heading === orientation);

function runAway(state: State) {
  const { warrior } = state;
  if (hasMeleeTarget(warrior, 'forward') && !hasMeleeTarget(warrior, 'backward')) {
    warrior.walk('backward');
    return SUCCESS;
  }
  if (hasMeleeTarget(warrior, 'backward') && !hasMeleeTarget(warrior, 'forward')) {
    warrior.walk('forward');
    return SUCCESS;
  }
  return FAILURE;
}

const canRescue = condition(({ warrior }: State) => isBound(warrior.feel('forward')));

function rescue({ warrior }: State) {
  warrior.rescue('forward');
  return SUCCESS;
}

const explore = sequence(
  sequence(
    updateHeading,
    selector(
      sequence(
        inverter(isOrientented),
        pivot
      ),
      sequence(
        canRescue,
        rescue
      ),
      sequence(
        canWalk,
        walk
      )
    )
  )
);

const combat = selector(
  sequence(
    isSeverlyHurt,
    runAway
  ),
  sequence(
    hasMeleeTargetInFront,
    meleeAttack
  ),
  sequence(
    hasPossibleRangeTarget,
    rangeAttack
  )
);

export const behavior = sequence(
  trackDamageTaken,
  trackExplorationProgress,
  selector(
    combat,
    explore
  )
);
