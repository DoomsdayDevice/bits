import { PagingStrategy } from '../../enums';
import { DeepPartial, IConnection, ObjectLiteral, Promisify, UUID } from '../../types';
import { IOffsetPagination, ISort } from '../grpc';
import { IGqlFilter } from './filter';

export interface IUpdateOneInput<T> {
  id: string;
  update: DeepPartial<T>;
}

export type ConnectionCursorType = string;

export interface ICursorPagination {
  before?: ConnectionCursorType;
  after?: ConnectionCursorType;
  first?: number;
  last?: number;
}

export type IPaging<P> = P extends PagingStrategy.CURSOR
  ? ICursorPagination
  : P extends PagingStrategy.OFFSET
  ? IOffsetPagination
  : undefined;

export interface IFindManyArgs<T, P extends PagingStrategy> {
  filter?: IGqlFilter<T>;
  paging?: IPaging<P>;
  sorting?: ISort[];
}

export type IBaseServiceRead<T, N extends string> = {
  [P in `${Uncapitalize<N>}`]: T;
} & {
  [P in `${Uncapitalize<N>}s`]: T[];
};

export type IBaseServiceWrite<T, N extends string> = {
  [P in `createOne${Capitalize<N>}`]: T;
} & {
  [P in `deleteOne${Capitalize<N>}`]: boolean;
} & {
  [P in `updateOne${Capitalize<N>}`]: T;
};

export type IBaseReadResolver<T extends ObjectLiteral, N extends string> = Promisify<
  {
    [P in `${Uncapitalize<N>}`]: (input: { id: string }) => T | Promise<T>;
  } & {
    [P in `${Uncapitalize<N>}s`]: (
      input: IFindManyArgs<T, PagingStrategy.OFFSET>,
    ) => IConnection<T>;
  }
>;

export type IBaseResolver<T extends ObjectLiteral, N extends string> = IBaseReadResolver<T, N> & {
  [P in `createOne${Capitalize<N>}`]: T;
} & {
  [P in `deleteOne${Capitalize<N>}`]: boolean;
} & {
  [P in `updateOne${Capitalize<N>}`]: T;
};
