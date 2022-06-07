import { FindConditions } from 'typeorm';
import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { Type } from '@nestjs/common';
import { IWritableCrudService } from '@bits/services/interface.service';
import { Sort } from '@apis/core';
import { FindByIdInput, OffsetPagination } from '../grpc.dto';

export interface IGrpcWriteController<M, RM = M> {
  createOne(newUser: CreateInput<M>): Promise<RM>;
  updateOne(user: UpdateInput<M>): Promise<StatusMsg>;
  deleteOne(user: FindConditions<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M> {
  findOne(input: FindByIdInput): Promise<M>;
  findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>>;
  convertExternalFilterToLocal(filter: any): any;
}

export interface IWritableGrpcControllerOpts<M, B extends Type, RM = M> {
  WriteModelCls: Type<M>;
  ServiceCls: Type<IWritableCrudService<M>>;
  CreateDTO?: Type;
  DeleteDTO?: Type;
  ReadModelCls?: Type<RM>;
  defineService: boolean;
  Base: B;
  separateRead?: boolean;
}

export interface IGrpcFindManyResponse<M> {
  totalCount: number;
  nodes: M[];
}

export interface IGrpcFindManyInput<M> {
  paging?: OffsetPagination;

  filter?: IGrpcFilter<M>;

  sorting?: IListValue<Sort>;
}

export interface DeleteOneResponse {
  success: boolean;
}

export interface DeleteOneInput {
  id: string;
}

export type CreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type UpdateInput<M> = Partial<M>;

export type IListValue<T> = {
  values: T[];
};
