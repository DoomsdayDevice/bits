import { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { Type } from '@nestjs/common';
import { IWritableCrudService } from '@bits/services/interface.service';
import { FindByIdInput, OffsetPagination, Sort } from '../grpc.dto';

export interface IGrpcWriteController<M, RM = M> {
  createOne(newUser: ICreateInput<M>): Promise<RM>;
  updateOne(user: IUpdateInput<M>): Promise<StatusMsg>;
  deleteOne(user: FindOptionsWhere<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M> {
  findOne(input: FindByIdInput): Promise<M>;
  findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>>;
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

export type ICreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type IFieldMask = {
  paths: string[];
};

export type IUpdateInput<M> = { update: Partial<M>; updateMask: IFieldMask };

export type IListValue<T> = {
  values: T[];
};
