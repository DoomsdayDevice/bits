import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';
import { Type } from '@nestjs/common';

@InputType({ isAbstract: true })
export class DeleteByIDInput {
  @Field(() => GraphQLUUID)
  id!: string;
}

export interface GqlWritableCrudConfig<M> {
  Model: Type<M>;
  modelName?: string;
  pagination?: boolean;
  grpcServiceName?: string;
  ModelResolver?: any;
  Service?: Type<any>;
}

export interface Connection<T> {
  totalCount: number;
  nodes: T[];
}

@InputType()
export class FindOneInput {
  @Field(() => GraphQLUUID)
  id!: string;
}
