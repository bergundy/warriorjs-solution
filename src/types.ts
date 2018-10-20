export type Direction = 'forward' | 'backward' | 'left' | 'right';
export type Orientation = 'up' | 'down' | 'left' | 'right';

export const ALL_DIRECTIONS: Direction[] = ['forward', 'left', 'backward', 'right'];
export const ALL_ORIENTATIONS: Orientation[] = ['up', 'left', 'down', 'right'];

export interface Unit {
  isEnemy(): boolean;
  isBound(): boolean;
  isUnderEffect(effect: string): boolean;
}

export interface Space {
  getUnit(): Unit | undefined;
  isUnit(): boolean;
  isEmpty(): boolean;
  isWall(): boolean;
  isStairs(): boolean;
}

export interface Warrior {
  health(): number;
  maxHealth(): number;
  look(dir: Direction): Space[];
  feel(dir: Direction): Space;
  listen(): Space[];
  attack(dir: Direction): void;
  walk(dir: Direction): void;
  shoot(dir: Direction): void;
  think(...args: any[]): void;
  pivot(dir: Direction): void;
  rescue(dir: Direction): void;
  bind(dir: Direction): void;
  rest(): void;
  directionOfStairs(): Direction;
  directionOf(space: Space): Direction;
}

export function relativeOrientation(origin: Orientation, direction: Direction) {
  const incr = ALL_DIRECTIONS.indexOf(direction);
  const idx = ALL_ORIENTATIONS.indexOf(origin);
  return ALL_ORIENTATIONS[(idx + incr) % ALL_ORIENTATIONS.length];
}

export function nextDirection(direction: Direction): Direction {
  const idx = ALL_DIRECTIONS.indexOf(direction);
  return ALL_DIRECTIONS[(idx + 1) % ALL_DIRECTIONS.length];
}
