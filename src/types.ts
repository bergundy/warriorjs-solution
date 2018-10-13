export type Direction = 'forward' | 'backward';

export const ALL_DIRECTIONS: Direction[] = ['forward', 'backward'];

export interface Unit {
  isEnemy(): boolean;
  isBound(): boolean;
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
  attack(dir: Direction): void;
  walk(dir: Direction): void;
  shoot(dir: Direction): void;
  think(...args: any[]): void;
  pivot(dir: Direction): void;
  rescue(dir: Direction): void;
  rest(): void;
}
