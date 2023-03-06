import { ICursorPagination, IGqlFilter } from "./index";
import {
  DeepPartial,
  IOffsetPagination,
  ISort,
  ObjectLiteral,
  PagingStrategy,
} from "@bits/core";

export interface IUpdateOneInput<T> {
  id: string;
  update: DeepPartial<T>;
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

export type IBaseResolver<T extends ObjectLiteral, N extends string> = {
  [P in `${Uncapitalize<N>}`]: T;
} & {
  [P in `${Uncapitalize<N>}s`]: T[];
} & { [P in `createOne${Capitalize<N>}`]: T } & {
  [P in `deleteOne${Capitalize<N>}`]: boolean;
} & {
  [P in `updateOne${Capitalize<N>}`]: T;
}; // & { service: ICrudService<T> };
