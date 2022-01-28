import { FindOperator } from 'typeorm';

export class BossOperator {
  // TODO finish this whole thing
  constructor(public type: any, public value: any) {} // eslint-disable-line
}

/**
 * расширение FindOperator для ComplexQuery
 * Example: { someField: Like("%some sting%") }
 */
export function Regex<T>(value: T | FindOperator<T>): FindOperator<T> {
  return new FindOperator('regex' as any, value);
}

export function And<T>(value: T[]): BossOperator {
  return new BossOperator('and', value);
}

export function Or<T>(value: T[]): BossOperator {
  return new BossOperator('or', value);
}
