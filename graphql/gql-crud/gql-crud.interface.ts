import { Type } from '@nestjs/common';
import { ModuleImportElem } from '@bits/bits.types';
import { IGqlFilter } from '@bits/graphql/filter/filter.interface';

export interface GqlWritableCrudConfig<M> {
  imports?: ModuleImportElem[];
  Model: Type<M>;
  modelName?: string;
  pagination?: boolean;
  grpcServiceName?: string;
  ModelResolver?: any;
  Service?: Type<any>;
  /** using grpc or simply typeorm */
  type?: 'grpc' | 'typeorm';
  readOnly?: boolean;
}

export interface IUpdateOneInput<T> {
  id: string;
  update: Partial<T>;
}

export interface IFindManyArgs<T> {
  filter?: IGqlFilter<T>;
}

export type IBaseServiceRead<T, N extends string> = { [P in `${Uncapitalize<N>}`]: T } & {
  [P in `${Uncapitalize<N>}s`]: T[];
};

export type IBaseServiceWrite<T, N extends string> = { [P in `createOne${Capitalize<N>}`]: T } & {
  [P in `deleteOne${Capitalize<N>}`]: boolean;
} & {
  [P in `updateOne${Capitalize<N>}`]: T;
};

export type IBaseResolver<T, N extends string> = { [P in `${Uncapitalize<N>}`]: T } & {
  [P in `${Uncapitalize<N>}s`]: T[];
} & { [P in `createOne${Capitalize<N>}`]: T } & { [P in `deleteOne${Capitalize<N>}`]: boolean } & {
  [P in `updateOne${Capitalize<N>}`]: T;
};
