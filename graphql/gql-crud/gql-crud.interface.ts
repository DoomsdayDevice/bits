import { CustomDecorator, Type } from '@nestjs/common';
import { ModuleImportElem } from '@bits/bits.types';
import { IGqlFilter } from '@bits/graphql/filter/filter.interface';
import { PagingStrategy } from '@bits/common/paging-strategy.enum';
import { Sort } from '@bits/grpc/grpc.dto';
import { ICrudService } from '@bits/services/interface.service';
import { ObjectLiteral } from 'typeorm';
import { ICursorPagination, IOffsetPagination } from '@bits/graphql/paging/pagination.interface';

export interface IUpdateOneInput<T> {
  id: string;
  update: Partial<T>;
}

export type IPaging<P> = P extends PagingStrategy.CURSOR
  ? ICursorPagination
  : P extends PagingStrategy.OFFSET
  ? IOffsetPagination
  : undefined;

export interface IFindManyArgs<T, P extends PagingStrategy> {
  filter?: IGqlFilter<T>;
  paging?: IPaging<P>;
  sorting?: Sort[];
}

export type IBaseServiceRead<T, N extends string> = { [P in `${Uncapitalize<N>}`]: T } & {
  [P in `${Uncapitalize<N>}s`]: T[];
};

export type IBaseServiceWrite<T, N extends string> = { [P in `createOne${Capitalize<N>}`]: T } & {
  [P in `deleteOne${Capitalize<N>}`]: boolean;
} & {
  [P in `updateOne${Capitalize<N>}`]: T;
};

export type IBaseResolver<T extends ObjectLiteral, N extends string> = {
  [P in `${Uncapitalize<N>}`]: T;
} & {
  [P in `${Uncapitalize<N>}s`]: T[];
} & { [P in `createOne${Capitalize<N>}`]: T } & { [P in `deleteOne${Capitalize<N>}`]: boolean } & {
  [P in `updateOne${Capitalize<N>}`]: T;
}; // & { service: ICrudService<T> };
