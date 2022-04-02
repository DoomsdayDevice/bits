import { FindManyUserInput } from '@domain/user/dto/find-many-user.input';
import { OffsetPagination } from '@domain/user/dto/pagination.dto';
import { DeepPartial } from 'typeorm';

export interface IGrpcController<M> {
  findOne(): Promise<M>;
  findMany(input: FindManyUserInput): Promise<FindManyResponse<M>>;
  createOne(newUser: CreateInput<M>): Promise<M>;
  updateOne(user: UpdateInput<M>): Promise<M>;
  deleteOne(user: DeleteOneInput): Promise<DeleteOneResponse>;
}

export interface FindManyResponse<M> {
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
