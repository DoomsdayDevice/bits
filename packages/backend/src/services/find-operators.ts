export class FilterOperation {
  // TODO finish this whole thing
  constructor(public type: any, public value: any) {} // eslint-disable-line
}

/**
 * расширение FindOperator для ComplexQuery
 * Example: { someField: Like("%some sting%") }
 */
export function Regex<T>(value: T | FilterOperation): FilterOperation {
  return new FilterOperation("regex" as any, value);
}

export function And<T>(value: T[]): FilterOperation {
  return new FilterOperation("and", value);
}

export function Or<T>(value: T[]): FilterOperation {
  return new FilterOperation("or", value);
}

export function Not<T>(value: T[]): FilterOperation {
  return new FilterOperation("not", value);
}

export function In<T>(value: T[]): FilterOperation {
  return new FilterOperation("in", value);
}

export function Like<T>(value: T[]): FilterOperation {
  return new FilterOperation("like", value);
}

export function ILike<T>(value: T[]): FilterOperation {
  return new FilterOperation("iLike", value);
}
