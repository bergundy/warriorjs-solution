export const add = (a: number, b: number) => a + b;
export const sum = (...arr: Array<number | boolean>) => arr.map(Number).reduce(add, 0);
export const zip = <T, U>(arr1: T[], arr2: U[]): Array<[T, U]> =>
  arr1.map((x, i): [T, U] => [x, arr2[i]]);
