export enum Result {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING',
}

export const SUCCESS = Result.SUCCESS;
export const FAILURE = Result.FAILURE;
export const RUNNING = Result.RUNNING;

export type BT<S> = (s: S) => Result;
export type Predicate<S> = (state: S) => boolean;

export function condition<S>(predicate: Predicate<S>) {
  return (state) => {
    if (predicate(state)) {
      return SUCCESS;
    } else {
      return FAILURE;
    }
  };
}

export function sequence<S>(...nodes: Array<BT<S>>) {
  return (state: S): Result => {
    let result = SUCCESS;
    for (const node of nodes) {
      result = node(state);
      if (result !== SUCCESS) {
        return result;
      }
    }
    return result;
  };
}

export function selector<S>(...nodes: Array<BT<S>>) {
  return (state: S): Result => {
    let result = SUCCESS;
    for (const node of nodes) {
      result = node(state);
      if (result !== FAILURE) {
        return result;
      }
    }
    return result;
  };
}

export function inverter<S>(handler: BT<S>) {
  return (state: S): Result => {
    const result = handler(state);
    switch (result) {
      case SUCCESS: return FAILURE;
      case FAILURE: return SUCCESS;
      case RUNNING: return RUNNING;
    }
  };
}

export function succeeder<S>(handler: BT<S>) {
  return (state: S): Result => {
    handler(state);
    return SUCCESS;
  };
}
