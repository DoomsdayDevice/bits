import { PagingStrategy } from '@bits/common/paging-strategy.enum';

export type ConnectionCursorType = string;

export interface ICursorPagination {
  before?: ConnectionCursorType;
  after?: ConnectionCursorType;
  first?: number;
  last?: number;
}

export interface IOffsetPagination {
  offset?: number;
  limit?: number;
}

export type IPaging<P> = P extends PagingStrategy.CURSOR
  ? ICursorPagination
  : P extends PagingStrategy.OFFSET
  ? IOffsetPagination
  : undefined;
