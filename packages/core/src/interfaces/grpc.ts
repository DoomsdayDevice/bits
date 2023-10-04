import { Class, ObjectLiteral } from '../types';
import { IGrpcFilter } from './filter.grpc';
import { SortDirection } from '../enums';

export interface IStatusMsg {
  success: boolean;
}

export type GMethodInput = {
  name: string;
  service: string;
  requestType: () => Class | string;
  responseType: () => Class | string;
  propertyKey: string;
  descriptor: any;
};

export type GServiceInput = { name: string };

export type GMessageInput = { name: string; oneOf?: boolean };

export type GFieldInput = {
  name: string;
  messageName: string;
  typeFn: () => any;
  rule?: string;
  filterable?: boolean;
  nullable?: boolean;
  listValue?: any;
};

export type GEnumInput = {
  enum: any;
  name: string;
};

/** for clients */
export interface IGrpcService<Enums, CreateInput = any, Model = CreateInput> {
  findOne(opts: { id: string }): Promise<Model>;
  findMany(input: IGrpcFindManyInput<Model, Enums>): Promise<IGrpcFindManyResponse<Model>>;
  deleteOne(input: any): Promise<IStatusMsg>;
  updateOne(input: IUpdateInput<CreateInput>): Promise<Model>;
  createOne(input: CreateInput): Promise<Model>;
}
export interface IGrpcFindManyResponse<M> {
  totalCount: number;
  nodes: M[];
}

export interface IGrpcFindManyInput<M, Enums> {
  paging?: IOffsetPagination;

  filter?: IGrpcFilter<M, Enums>;

  sorting?: IListValue<ISort>;
}

export interface IOffsetPagination {
  offset?: number;
  limit?: number;
}

export interface DeleteOneResponse {
  success: boolean;
}

export interface DeleteOneInput {
  id: string;
}

export type ICreateInput<M> = Omit<M, 'createdAt' | 'id' | 'updatedAt'>;

export type IFieldMask = {
  paths: string[];
};

export type IUpdateInput<M> = { update: Partial<M>; updateMask: IFieldMask };

export type IListValue<T> = {
  values: T[];
};
export interface IFindByIdInput {
  id: string;
}
export interface ISort {
  field: string;
  direction: SortDirection;
}
