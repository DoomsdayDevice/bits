import { FindManyUserInput } from '@domain/user/dto/find-many-user.input';
import { CreateUserInput } from '@domain/user/dto/create-user.input';
import { UpdateUserInput } from '@domain/user/dto/update-user.input';
import { DeleteUserInput } from '@domain/user/dto/delete-user.input';
import { GrpcFieldDef } from '@bits/grpc/decorators/field.decorator';
import { OffsetPagination } from '@domain/user/dto/pagination.dto';
import { UserFilter } from '@domain/user/dto/user-filter.input';
import { DeepPartial } from 'typeorm';
import { User } from '@domain/user/user.entity';

export interface IGrpcController<M> {
  findOne(): Promise<M>;
  findMany(input: FindManyUserInput): Promise<FindManyResponse<M>>;
  createOne(newUser: CreateUserInput): Promise<M>;
  updateOne(user: UpdateUserInput): Promise<M>;
  deleteOne(user: DeleteUserInput): Promise<DeleteOneResponse>;
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

export type CreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type UpdateInput<M> = Partial<M>;
