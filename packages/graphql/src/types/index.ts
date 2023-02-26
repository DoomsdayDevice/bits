export * from "./filter";
export * from "./crud";
export * from "./filterable-field";
export * from "./crud-config";
export * from "./filter-field-comparison";

export type ConnectionCursorType = string;

export interface ICursorPagination {
  before?: ConnectionCursorType;
  after?: ConnectionCursorType;
  first?: number;
  last?: number;
}

export type GqlEnumCfg = { e: Record<string, string>; name: string };
