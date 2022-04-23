import { DeepPartial, FindConditions } from 'typeorm';
import { FindOneInput, OffsetPagination } from '../grpc.dto';
import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';

export interface IGrpcWriteController<M> {
  createOne(newUser: CreateInput<M>): Promise<M>;
  updateOne(user: UpdateInput<M>): Promise<StatusMsg>;
  deleteOne(user: FindConditions<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M> {
  findOne(input: FindOneInput): Promise<M>;
  findMany(input: FindManyInput<M>): Promise<FindManyResponse<M>>;
}

export interface FindManyResponse<M> {
  totalCount: number;
  nodes: M[];
}

export interface FindManyInput<M> {
  paging: OffsetPagination;

  filter: Filter<M>;
}

export type Filter<M> = DeepPartial<M>;

export interface DeleteOneResponse {
  success: boolean;
}

export interface DeleteOneInput {
  id: string;
}

export type CreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type UpdateInput<M> = Partial<M>;
