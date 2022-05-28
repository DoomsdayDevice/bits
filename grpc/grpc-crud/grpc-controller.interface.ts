import { FindConditions } from 'typeorm';
import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { FindByIdInput, OffsetPagination } from '../grpc.dto';

export interface IGrpcWriteController<M> {
  createOne(newUser: CreateInput<M>): Promise<M>;
  updateOne(user: UpdateInput<M>): Promise<StatusMsg>;
  deleteOne(user: FindConditions<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M> {
  findOne(input: FindByIdInput): Promise<M>;
  findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>>;
}

export interface IGrpcFindManyResponse<M> {
  totalCount: number;
  nodes: M[];
}

export interface IGrpcFindManyInput<M> {
  paging?: OffsetPagination;

  filter?: IGrpcFilter<M>;
}

export interface DeleteOneResponse {
  success: boolean;
}

export interface DeleteOneInput {
  id: string;
}

export type CreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type UpdateInput<M> = Partial<M>;
