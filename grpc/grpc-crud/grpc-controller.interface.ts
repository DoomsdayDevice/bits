import { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { Type } from '@nestjs/common';
import { IWritableCrudService } from '@bits/services/interface.service';
import { FindByIdInput, OffsetPagination, Sort } from '../grpc.dto';

export interface IGrpcWriteController<M, RM = M> {
  createOne(newUser: CreateInput<M>): Promise<RM>;
  updateOne(user: UpdateInput<M>): Promise<StatusMsg>;
  deleteOne(user: FindOptionsWhere<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M, Enums> {
  findOne(input: FindByIdInput): Promise<M>;
  findMany(input: IGrpcFindManyInput<M, Enums>): Promise<IGrpcFindManyResponse<M>>;
}

export interface IWritableGrpcControllerOpts<M extends ObjectLiteral, B extends Type, RM = M> {
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

export interface IGrpcFindManyInput<M, Enums> {
  paging?: OffsetPagination;

  filter?: IGrpcFilter<M, Enums>;

  sorting?: IListValue<Sort>;
}

export interface DeleteOneResponse {
  success: boolean;
}

export interface DeleteOneInput {
  id: string;
}

export type CreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type FieldMask = {
  paths: string[];
};

export type UpdateInput<M> = { update: Partial<M>; updateMask: FieldMask };

export type IListValue<T> = {
  values: T[];
};
